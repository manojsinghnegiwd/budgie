const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputFavicon = path.join(__dirname, '../public/favicon.ico');

async function generateFavicon() {
  console.log('Generating favicon.ico from SVG...\n');
  
  // Read the SVG file
  const svgBuffer = fs.readFileSync(inputSvg);
  
  try {
    // Create favicon.ico (32x32 is standard)
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputFavicon);
    
    console.log('✓ Generated favicon.ico');
  } catch (error) {
    console.error('✗ Failed to generate favicon.ico:', error.message);
  }
}

generateFavicon().catch(console.error);

