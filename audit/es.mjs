import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:8899/experiences/?lang=es', { waitUntil: 'networkidle' });
await p.screenshot({ path: '/tmp/shots/es.png' });
await b.close(); console.log('ok');
