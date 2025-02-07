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
  // This call uses the new syntax: pass 'eng' directly.
  const worker = await createWorker('eng');

  // Recognize the text from the file buffer.
  const { data: { text } } = await worker.recognize(file.buffer);
  console.log('Extracted text from image:', text);
  await worker.terminate();
  
  return text;
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
    const extractedText = await processImage(req.file);
    console.log('OCR completed. Extracted text:', extractedText);
    
    console.log('Starting tracker search...');
    const trackerResults = await searchTracker(extractedText);
    console.log('Tracker search completed. Results:', trackerResults);
    
    const response = { 
      success: true, 
      extractedText,
      trackerResults 
    };
    console.log('Sending response:', response);
    
    res.json(response);
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ success: false, error: 'Failed to process image' });
  }
});

// Update the searchTracker function to better handle the extracted text
async function searchTracker(playerName) {
  let browser;
  try {
    const url = `https://tracker.gg/marvel-rivals/profile/ign/${playerName}/overview`;
    console.log('Starting search for player:', playerName);
    console.log('URL:', url);
    
    const { browser: newBrowser, page } = await connect({
      headless: false,
      args: [],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false
    });
    
    browser = newBrowser;

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
        await page.waitForTimeout(1000); // Wait for popup to disappear
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
      // Get all v3-card sections
      const sections = document.querySelectorAll('section.v3-card');
      if (!sections || sections.length < 2) {
        console.log('Required sections not found');
        return null;
      }

      // Target the second section specifically
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
        
        // Log the raw data for debugging
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

    try {
      await page.screenshot({ path: 'debug-final.png' });
      console.log('Screenshot saved');
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }

    // Force close all pages and browser
    const pages = await browser.pages();
    await Promise.all(pages.map(page => page.close()));
    await browser.close({ forceKill: true });
    console.log('Browser forcefully closed');

    return {
      status: 'success',
      message: 'Page loaded successfully',
      playerName: playerName,
      heroes: heroesData
    };

  } catch (error) {
    console.error('Error searching tracker:', error);
    if (browser) {
      try {
        const pages = await browser.pages();
        await Promise.all(pages.map(page => page.close()));
        await browser.close({ forceKill: true });
        console.log('Browser forcefully closed after error');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
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
  searchTracker
};
