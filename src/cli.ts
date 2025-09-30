#!/usr/bin/env node

import { Command } from '@commander-js/extra-typings';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { launch } from 'puppeteer';
import { pngCompare, takeScreenshot, type TakeScreenshotOpts } from '.';
import { mkdirp } from 'mkdirp';

const prog = new Command()
  .argument('<first-url>')
  .argument('<second-url>')
  .option('--no-headless')
  .option('--headless', 'launch browser in headless mode', true)
  .option('--no-full-page')
  .option('--full-page', 'take full page screenshot', true)
  .option('--viewport <size>', 'viewport size', '1920x1080')
  .option(
    '--out-dir <path>',
    'output directory to save screenshots and difference',
    './tmp',
  )
  .parse();

function parseViewportSize(size: string) {
  const [width, height] = size.split('x');

  return { width: Number(width ?? '1920'), height: Number(height ?? '1080') };
}

async function main() {
  const [url1, url2] = prog.args;
  const viewport = parseViewportSize(prog.opts().viewport);
  const opts = prog.opts();
  const browser = await launch({ headless: opts.headless });
  const screenshotOpts: TakeScreenshotOpts = {
    viewport,
    fullPage: opts.fullPage,
  };
  const timestamp = (Date.now() / 1000).toFixed(0);
  const oldSsPath = join(opts.outDir, `${timestamp}_1old.png`);
  const newSsPath = join(opts.outDir, `${timestamp}_2new.png`);
  const diffPath = join(opts.outDir, `${timestamp}_3diff.png`);

  await mkdirp(opts.outDir);

  if (!url1 || !url2) throw new Error('urls are required');

  try {
    const [ss1, ss2] = await Promise.all([
      takeScreenshot(browser, url1, screenshotOpts),
      takeScreenshot(browser, url2, screenshotOpts),
    ]);

    await writeFile(oldSsPath, ss1);
    console.log(`✔️ Saved "${url1}" screenshot to ${oldSsPath}`);

    await writeFile(newSsPath, ss2);
    console.log(`✔️ Saved "${url2}" screenshot to ${newSsPath}`);

    const diff = pngCompare(ss1, ss2);

    if (diff === null) console.log('✔️ Screenshots are identical');
    else if (diff === 'dimension-mismatch')
      console.log('✖️ Screenshot dimensions do not match.');
    else {
      await writeFile(diffPath, PNG.sync.write(diff.png));

      console.log(
        `🇮 Screenshots have ${diff.pixels} different pixels. Difference image is saved to ${diffPath}`,
      );
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.log('Main error:', err);

  process.exit(1);
});
