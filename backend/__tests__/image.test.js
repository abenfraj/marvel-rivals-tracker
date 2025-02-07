const fs = require('fs');
const path = require('path');

// Read the actual test image file
const imagePath = path.join(__dirname, '../image.png');
const imageBuffer = fs.readFileSync(imagePath);

const mockImageFile = {
  fieldname: 'image',
  originalname: 'karage.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: imageBuffer,
  size: imageBuffer.length
};

// Remove the Tesseract mock so it uses the real OCR
jest.unmock('tesseract.js');

describe('Image processing tests', () => {
  it('should process the image and extract "Karage"', async () => {
    const { processImage } = require('../app');
    
    const result = await processImage(mockImageFile);
    console.log('Actual extracted text:', result);
    expect(result.toLowerCase().includes('karage')).toBe(true);
  }, 30000); // Increased timeout since real OCR takes longer
});