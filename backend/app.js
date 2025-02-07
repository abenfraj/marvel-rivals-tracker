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

    // Get the heroes data
    const heroesData = await page.evaluate(() => {
      const sections = document.querySelectorAll('section.v3-card');
      if (!sections || sections.length < 2) {
        console.log('Required sections not found');
        return null;
      }

      const heroesSection = sections[1];
      if (!heroesSection) {
        console.log('Second section not found');
        return null;
      }

      console.log('Found heroes section');
      const heroElements = heroesSection.querySelectorAll('.flex.gap-4.items-center');
      console.log('Number of hero elements found:', heroElements.length);

      const heroes = Array.from(heroElements).map(heroElement => {
        const name = heroElement.querySelector('img')?.alt;
        const imageUrl = heroElement.querySelector('img')?.src;
        
        console.log('Processing hero:', name);
        console.log('Hero element HTML:', heroElement.outerHTML);

        return {
          name,
          imageUrl
        };
      });

      return heroes;
    });

    console.log('Extracted heroes data:', heroesData);

    return {
      status: 'success',
      message: 'Page loaded successfully',
      playerName: playerName,
      heroes: heroesData
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
