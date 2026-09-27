// Tiny real-browser cases for the audit itself; ui:shots runs these before
// checking game screens so CI cannot silently accept a broken measurement.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { measureInPage } from './ui-measure.mjs';

export async function verifyMeasurements(browser) {
  const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
  await page.route('**/*', (route) => route.abort());
  const measure = async (html) => {
    await page.setContent(`<style>body{margin:0;background:white;color:black;font:16px Arial}button{font:inherit}p{padding:8px}</style><main>${html}</main>`);
    return page.evaluate(measureInPage);
  };
  try {
    let m = await measure('<p style="color:white;background:color-mix(in srgb,#5f8a55 70%,#3d2b1d)">readable badge</p>');
    assert.equal(m.lowCount, 0, 'white ink on a dark color-mix badge must use the badge background');

    m = await measure('<p style="color:white;background:color-mix(in srgb,white 80%,#5f8a55)">faint badge</p>');
    assert.equal(m.lowCount, 1, 'color-mix must not hide genuinely low-contrast text');
    assert.ok(m.low[0].ratio < 1.5);

    m = await measure('<p style="color:color-mix(in srgb,white 90%,black);background:white">faint ink</p>');
    assert.equal(m.lowCount, 1, 'color(srgb) foregrounds must be measured too');

    m = await measure('<div style="background:black"><p style="color:white;background:color(srgb 1 1 1 / .5)">alpha background</p></div>');
    assert.equal(m.lowCount, 1, 'a translucent srgb background must blend with its parent');
    assert.ok(m.low[0].ratio > 3.9 && m.low[0].ratio < 4.1);

    m = await measure('<p style="color:white;background:color(srgb-linear .25 .25 .25)">linear background</p>');
    assert.equal(m.lowCount, 1);
    assert.equal(m.low[0].ratio, 3.5, 'linear channels need sRGB transfer before luminance');

    const box = (buttonTop, overlayTop, overlayHeight = 40) => `
      <div style="position:absolute;left:20px;top:20px;width:160px;height:80px;overflow:auto;border:2px solid black">
        <div style="height:240px;position:relative"><button style="position:absolute;top:${buttonTop}px;left:10px;width:120px;height:40px">target</button></div>
      </div>
      <div class="obstruction" style="position:absolute;left:25px;top:${overlayTop}px;width:150px;height:${overlayHeight}px;background:white;z-index:2"></div>`;
    m = await measure(box(120, 142));
    assert.equal(m.coveredCount, 0, 'buttons entirely below their scrollport are not covered controls');
    m = await measure(box(65, 110));
    assert.equal(m.coveredCount, 0, 'the hidden portion of a partially visible button is not sampled');
    m = await measure(box(65, 87, 15));
    assert.equal(m.coveredCount, 1, 'an overlay on the visible portion must still fail');
    assert.equal(m.covered[0].by, 'obstruction');
    m = await measure(box(10, 32));
    assert.equal(m.coveredCount, 1, 'ordinary fully visible covered controls must still fail');

    m = await measure(`<div style="position:absolute;left:20px;top:20px;width:100px;height:60px;overflow:hidden">
      <button style="position:absolute;left:80px;top:5px;width:100px;height:40px">horizontal</button></div>
      <div style="position:absolute;left:150px;top:25px;width:100px;height:40px;background:white"></div>`);
    assert.equal(m.coveredCount, 0, 'horizontal overflow clipping also limits hit-test samples');
    console.log('UI measurement fixtures: 10 passed');
  } finally {
    await page.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--disable-logging'] });
  try {
    await verifyMeasurements(browser);
  } finally {
    await browser.close();
  }
}
