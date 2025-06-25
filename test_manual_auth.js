const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set the session cookie from our login
  await page.setCookie({
    name: 'connect.sid',
    value: require('fs').readFileSync('cookies.txt', 'utf8').match(/connect\.sid\s+([^\s]+)/)?.[1] || '',
    domain: 'localhost',
    path: '/',
    httpOnly: true
  });
  
  // Go to dashboard
  await page.goto('http://localhost:5000/dashboard');
  
  // Wait for auth utilities to be available
  await page.waitForFunction(() => window.authUtils, { timeout: 10000 });
  
  // Test manual auth refresh
  const authResult = await page.evaluate(async () => {
    console.log('Testing manual auth refresh...');
    const result = await window.authUtils.manualRefresh();
    return {
      success: !!result,
      userData: result,
      authUtilsState: {
        currentUser: window.authUtils.currentUser,
        isAuthenticated: window.authUtils.isAuthenticated,
        isAdmin: window.authUtils.isAdmin,
        isSchoolAdmin: window.authUtils.isSchoolAdmin,
        isOwner: window.authUtils.isOwner
      }
    };
  });
  
  console.log('Auth refresh test result:', JSON.stringify(authResult, null, 2));
  
  await browser.close();
})().catch(console.error);
