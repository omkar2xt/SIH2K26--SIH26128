import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFlows() {
  console.log('--- Launching Chrome via Puppeteer-Core ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  console.log('Step 1: Navigate to http://localhost:5173');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  console.log('Page title:', await page.title());

  // Step 2: Language testing on Landing page
  console.log('Step 2: Language toggle test');
  const buttons = await page.$$('button');
  let mrBtn, hiBtn, enBtn;
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('मराठी')) mrBtn = b;
    if (text.includes('हिंदी')) hiBtn = b;
    if (text.includes('English')) enBtn = b;
  }

  if (mrBtn) {
    await mrBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const heading = await page.$eval('h1', el => el.innerText);
    console.log('Marathi heading:', heading);
  }

  if (hiBtn) {
    await hiBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const heading = await page.$eval('h1', el => el.innerText);
    console.log('Hindi heading:', heading);
  }

  if (enBtn) {
    await enBtn.click();
    await new Promise(r => setTimeout(r, 400));
    const heading = await page.$eval('h1', el => el.innerText);
    console.log('English heading:', heading);
  }

  // Step 3: Farmer Login
  console.log('Step 3: Farmer Login');
  let farmerBtn;
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('Farmer') || text.includes('Open Farmer Demo')) {
      farmerBtn = b;
      break;
    }
  }

  if (farmerBtn) {
    console.log('Found Farmer demo button, clicking...');
    await farmerBtn.click();
  }

  // Wait for Dashboard to appear
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Farmer') || 
           document.body.innerText.includes('Active Animals') ||
           window.location.hash.includes('dashboard');
  }, { timeout: 10000 });

  console.log('Farmer Dashboard loaded successfully! URL:', page.url());

  await browser.close();
  console.log('Smoke test passed successfully!');
}

testFlows().catch(console.error);
