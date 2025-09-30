import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { Browser, PuppeteerLifeCycleEvent, Viewport } from 'puppeteer';

export interface TakeScreenshotOpts {
  viewport?: Viewport;
  fullPage?: boolean;
  waitFor?: PuppeteerLifeCycleEvent;
  targetElementSelector?: string;
}

export function pngCompare(
  i1: Uint8Array<ArrayBufferLike>,
  i2: Uint8Array<ArrayBufferLike>,
): { pixels: number; png: PNG } | 'dimension-mismatch' | null {
  const p1 = PNG.sync.read(Buffer.from(i1));
  const p2 = PNG.sync.read(Buffer.from(i2));

  if (p1.width !== p2.width || p1.height !== p2.height)
    return 'dimension-mismatch';

  const diff = new PNG({ width: p1.width, height: p1.height });

  const differentPixels = pixelmatch(
    p1.data,
    p2.data,
    diff.data,
    p1.width,
    p1.height,
  );

  if (differentPixels === 0) return null;

  return { png: diff, pixels: differentPixels };
}

export async function takeScreenshot(
  browser: Browser,
  url: string,
  opts?: TakeScreenshotOpts,
): Promise<Uint8Array> {
  const page = await browser.newPage();

  if (opts?.viewport) {
    await page.setViewport(opts.viewport);
  }

  await page.goto(url, { waitUntil: opts?.waitFor });

  if (opts?.targetElementSelector) {
    const el = await page.$(opts.targetElementSelector);

    if (!el)
      throw new Error(
        `Selector "${opts.targetElementSelector}" did not match anything`,
      );

    return await el.screenshot();
  }

  return page.screenshot({ fullPage: opts?.fullPage });
}
