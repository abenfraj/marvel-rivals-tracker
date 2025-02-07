const express = require('express');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const puppeteer = require('puppeteer');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { connect } = require("puppeteer-real-browser");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer to handle file uploads in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Enable CORS for all routes
app.use(cors());

// Use the new Tesseract.js API that accepts the language as an argument.
async function processImage(file) {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(file.buffer);
  await worker.terminate();
  
  // Split text by newlines and filter out empty lines
  const playerNames = text
    .split('\n')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  
  console.log('Extracted player names:', playerNames);
  return playerNames;
}

// POST endpoint to receive the screenshot image.
app.post('/upload', upload.single('image'), async (req, res) => {
  console.log('Upload endpoint hit');
  if (!req.file) {
    console.log('No file received');
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }
  
  console.log('Processing file:', req.file.originalname);
  
  try {
    console.log('Starting OCR processing...');
    const playerNames = await processImage(req.file);
    console.log('OCR completed. Player names:', playerNames);
    
    // Process each player name in parallel with separate browser instances
    const trackerPromises = playerNames.map(async (playerName) => {
      const { browser: newBrowser, page } = await connect({
        headless: false,
        args: [],
        customConfig: {},
        turnstile: true,
        connectOption: {},
        disableXvfb: false,
        ignoreAllFlags: false
      });
      
      try {
        const result = await searchTrackerWithBrowser(playerName, page);
        await newBrowser.close({ forceKill: true });
        return result;
      } catch (error) {
        await newBrowser.close({ forceKill: true });
        throw error;
      }
    });
    
    const trackerResults = await Promise.all(trackerPromises);
    console.log('All tracker searches completed');
    
    const response = { 
      success: true, 
      extractedText: playerNames.join('\n'),
      trackerResults 
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ success: false, error: 'Failed to process image' });
  }
});

// New function that takes an existing page instance
async function searchTrackerWithBrowser(playerName, page) {
  try {
    const url = `https://tracker.gg/marvel-rivals/profile/ign/${playerName}/overview`;
    console.log('Starting search for player:', playerName);
    console.log('URL:', url);

    console.log('Navigating to page...');
    await page.goto(url);
    console.log('Page loaded');

    // Handle cookie popup
    try {
      console.log('Looking for cookie popup...');
      const cookieButton = await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      if (cookieButton) {
        console.log('Cookie popup found, clicking accept...');
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('No cookie popup found or already accepted');
    }

    // Initial wait
    console.log('Initial wait...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    let pageLoaded = false;
    let attempts = 0;
    const maxAttempts = 12;
    
    while (attempts < maxAttempts && !pageLoaded) {
      console.log(`Attempt ${attempts + 1} of ${maxAttempts}`);
      try {
        const content = await page.content();
        if (content.includes('Top Heroes') || content.includes('trn-card')) {
          console.log('Profile page loaded successfully');
          pageLoaded = true;
          break;
        }

        console.log('Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error during page check:', error);
        attempts++;
      }
    }

    if (!pageLoaded) {
      throw new Error('Could not load profile page after maximum attempts');
    }

    // Get both heroes and roles data in a single evaluate call
    const data = await page.evaluate(() => {
      const sections = document.querySelectorAll('section.v3-card');
      if (!sections || sections.length < 2) return { heroes: [], roles: [] };

      // Extract roles data from first section
      const rolesSection = sections[0];
      const roles = [];

      if (rolesSection) {
        const roleElements = rolesSection.querySelectorAll('.flex.gap-4.items-center');
        
        roleElements.forEach(roleElement => {
          const name = roleElement.querySelector('.text-12.text-secondary')?.textContent?.trim();
          const imageUrl = roleElement.querySelector('img')?.src;
          const percentage = roleElement.querySelector('.role-chart')?.style.getPropertyValue('--percentage')?.replace('%', '') || '0';
          
          const stats = {
            winRate: 0,
            wins: 0,
            kda: 0,
            kills: 0,
            deaths: 0,
            assists: 0
          };

          // Get Win Rate data
          const wrSection = roleElement.querySelectorAll('.stat-hor')[0];
          if (wrSection) {
            const wrText = wrSection.querySelector('.stat-value')?.textContent?.trim();
            stats.winRate = parseFloat(wrText) || 0;
            stats.wins = parseInt(wrSection.querySelector('.stat-list .value')?.textContent) || 0;
          }

          // Get KDA data
          const kdaSection = roleElement.querySelectorAll('.stat-hor')[1];
          if (kdaSection) {
            const kdaText = kdaSection.querySelector('.stat-value')?.textContent?.trim();
            stats.kda = parseFloat(kdaText) || 0;

            const [kills, deaths, assists] = Array.from(kdaSection.querySelectorAll('.stat-list .value'))
              .map(el => parseFloat(el.textContent.trim()) || 0);
            stats.kills = kills;
            stats.deaths = deaths;
            stats.assists = assists;
          }

          roles.push({
            name,
            imageUrl,
            percentage: parseFloat(percentage),
            stats
          });
        });
      }

      // Extract heroes data from second section
      const heroesSection = sections[1];
      const heroes = [];

      if (heroesSection) {
        const heroElements = heroesSection.querySelectorAll('.flex.gap-4.items-center');
        
        heroElements.forEach(heroElement => {
          const name = heroElement.querySelector('img')?.alt;
          const imageUrl = heroElement.querySelector('img')?.src;
          
          const stats = {
            winRate: 0,
            wins: 0,
            losses: 0,
            kda: 0,
            kills: 0,
            deaths: 0,
            assists: 0
          };

          // Get Win Rate data
          const wrSection = heroElement.querySelector('.stat-hor');
          if (wrSection) {
            const wrText = wrSection.querySelector('.stat-value')?.textContent?.trim();
            stats.winRate = parseFloat(wrText) || 0;

            const [winsText, lossesText] = Array.from(wrSection.querySelectorAll('.stat-list .value'))
              .map(el => el.textContent.trim());
            stats.wins = parseInt(winsText) || 0;
            stats.losses = parseInt(lossesText) || 0;
          }

          // Get KDA data
          const kdaSection = heroElement.querySelectorAll('.stat-hor')[1];
          if (kdaSection) {
            const kdaText = kdaSection.querySelector('.stat-value')?.textContent?.trim();
            stats.kda = parseFloat(kdaText) || 0;

            const [kills, deaths, assists] = Array.from(kdaSection.querySelectorAll('.stat-list .value'))
              .map(el => parseFloat(el.textContent.trim()) || 0);
            stats.kills = kills;
            stats.deaths = deaths;
            stats.assists = assists;
          }

          heroes.push({
            name,
            imageUrl,
            stats
          });
        });
      }

      return { heroes, roles };
    });

    console.log('Extracted data:', data);

    return {
      status: 'success',
      message: 'Page loaded successfully',
      playerName: playerName,
      heroes: data.heroes,
      roles: data.roles
    };

  } catch (error) {
    console.error('Error searching tracker:', error);
    return {
      status: 'error',
      message: error.message,
      playerName: playerName
    };
  }
}

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = {
  app,
  processImage,
  searchTrackerWithBrowser
};
