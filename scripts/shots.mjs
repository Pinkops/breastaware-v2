import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5173';
const OUT = '/home/user/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const demoInit = () => sessionStorage.setItem('ba2.mode', 'demo');

const browser = await chromium.launch({ headless: true });

async function open(page, hash) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle' });
}

async function shot(name, hash, { w = 390, h = 844, demo = true, full = false, wait = 900, actions } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  if (demo) await ctx.addInitScript(demoInit);
  const page = await ctx.newPage();
  await open(page, hash);
  if (actions) await actions(page);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await ctx.close();
  console.log('✓', name);
}

async function run() {
  await shot('01-landing-desktop', '#/', { w: 1280, h: 860, demo: false, full: true, wait: 600 });
  await shot('02-home-mobile', '#/home');
  await shot('03-record-what-mobile', '#/record', { wait: 600 });

  // Record flow → body map step
  await shot('04-record-bodymap-mobile', '#/record', {
    wait: 700,
    actions: async (page) => {
      await page.getByText('Lump or thickening').first().click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByText('Right', { exact: true }).first().click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.waitForTimeout(400);
    },
  });

  await shot('05-timeline-mobile', '#/timeline');
  await shot('06-my-normal-mobile', '#/my-normal');
  await shot('07-prepare-mobile', '#/prepare');
  await shot('08-questions-mobile', '#/questions', { wait: 700 });

  // Summary (endpoint of the workflow) — resolve id from demo data
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(demoInit);
    const page = await ctx.newPage();
    await open(page, '#/home');
    const id = await page.evaluate(() => {
      try {
        const d = JSON.parse(sessionStorage.getItem('ba2.demo.v2') || 'null');
        return d?.summaries?.[0]?.id ?? '';
      } catch {
        return '';
      }
    });
    if (id) {
      await page.goto(`${BASE}/#/summary/${id}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${OUT}/09-summary-mobile.png`, fullPage: true });
      console.log('✓ 09-summary-mobile');
    } else {
      console.log('! summary id not found');
    }
    await ctx.close();
  }

  await shot('10-home-desktop', '#/home', { w: 1280, h: 860 });
  await shot('11-education-mobile', '#/education/breast-self-awareness', { wait: 600 });
  await shot('12-screening-mobile', '#/screening', { wait: 600 });
}

try {
  await run();
  console.log('ALL_DONE');
} catch (err) {
  console.error('FAILED:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
