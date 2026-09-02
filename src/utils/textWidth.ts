// Pixel-accurate text width via Canvas 2D, so chord labels can be aligned
// exactly above their target character regardless of font metrics (CJK
// glyphs typically render wider than Latin ones, and the exact ratio
// varies by font/OS/browser, so a fixed-ratio estimate always drifts).
let measureCtx: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  try {
    measureCtx = document.createElement('canvas').getContext('2d');
  } catch {
    measureCtx = null;
  }
  return measureCtx;
}

export function measureTextWidth(text: string, font: string): number {
  const ctx = getMeasureContext();
  if (!ctx) return text.length * 8;
  ctx.font = font;
  return ctx.measureText(text).width;
}
