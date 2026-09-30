const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\52c0eeab-cf9a-4811-a481-047890e8e419\\scratch';

async function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  console.log('Starting Puppeteer for Demo Screenshots...');
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  try {
    // 1. Landing
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '01_Landing.png') });
    console.log('Captured: 01_Landing.png');

    // 2. Farmer Dashboard
    // Click Farmer Login
    const farmerLoginBtn = await page.$x("//button[contains(text(), 'Farmer Login')]");
    if (farmerLoginBtn.length > 0) {
      await farmerLoginBtn[0].click();
      await delay(2000);
      await page.screenshot({ path: path.join(OUT_DIR, '02_Farmer_Dashboard.png') });
      console.log('Captured: 02_Farmer_Dashboard.png');

      // 3. Animal Profile (MH-CAT-027)
      // Navigate to Animal Profile directly or by clicking
      await page.goto('http://localhost:5173/animal/6f95aaf1-ac84-4691-a8c0-c54e66e74828', { waitUntil: 'networkidle2' });
      await delay(2000);
      await page.screenshot({ path: path.join(OUT_DIR, '03_Animal_Profile.png') });
      console.log('Captured: 03_Animal_Profile.png');
      
      // 4. Report Health Issue & Risk Result
      // To show risk result, we can just screenshot the current profile which has the RED risk if it's evaluated,
      // or we can click 'Evaluate Health Risk' if it exists.
      const evalBtn = await page.$x("//button[contains(text(), 'Evaluate Health Risk')]");
      if (evalBtn.length > 0) {
        await evalBtn[0].click();
        await delay(3000);
      }
      await page.screenshot({ path: path.join(OUT_DIR, '04_Risk_Result.png') });
      console.log('Captured: 04_Risk_Result.png');
    }

    // 5. Official Dashboard / GIS
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await delay(1000);
    const officialLoginBtn = await page.$x("//button[contains(text(), 'Official Login')]");
    if (officialLoginBtn.length > 0) {
      await officialLoginBtn[0].click();
      await delay(2000);
      await page.screenshot({ path: path.join(OUT_DIR, '08_Official_Dashboard.png') });
      console.log('Captured: 08_Official_Dashboard.png');

      // Click Map View tab
      const mapBtn = await page.$x("//button[contains(text(), 'Map View')]");
      if (mapBtn.length > 0) {
        await mapBtn[0].click();
        await delay(3000); // let map load
        await page.screenshot({ path: path.join(OUT_DIR, '09_GIS_Map.png') });
        console.log('Captured: 09_GIS_Map.png');
      }
    }

    // 6. Vet Dashboard & Lab
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await delay(1000);
    const vetLoginBtn = await page.$x("//button[contains(text(), 'Veterinarian Login')]");
    if (vetLoginBtn.length > 0) {
      await vetLoginBtn[0].click();
      await delay(2000);
      await page.screenshot({ path: path.join(OUT_DIR, '06_Vet_Case.png') });
      console.log('Captured: 06_Vet_Case.png');
      
      // Navigate to Lab tab
      const labBtn = await page.$x("//button[contains(text(), 'Laboratory')]");
      if (labBtn.length > 0) {
        await labBtn[0].click();
        await delay(2000);
        await page.screenshot({ path: path.join(OUT_DIR, '07_Laboratory_Result.png') });
        console.log('Captured: 07_Laboratory_Result.png');
      }
    }

    console.log('All screenshots captured successfully.');

  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

run();
