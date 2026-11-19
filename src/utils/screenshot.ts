export async function captureVisionScreenshot(
  canvasElements: (HTMLCanvasElement | null)[],
  filenamePrefix = 'visionx-hologram'
): Promise<string> {
  const validCanvases = canvasElements.filter((c): c is HTMLCanvasElement => c !== null);
  if (validCanvases.length === 0) return '';

  const width = validCanvases[0].width || window.innerWidth;
  const height = validCanvases[0].height || window.innerHeight;

  const composite = document.createElement('canvas');
  composite.width = width;
  composite.height = height;
  const ctx = composite.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, width, height);

  // Draw layers in order
  for (const canvas of validCanvases) {
    try {
      ctx.drawImage(canvas, 0, 0, width, height);
    } catch (e) {
      console.warn('Canvas capture skipped a layer:', e);
    }
  }

  // Add VisionX Watermark
  ctx.fillStyle = '#00e5ff';
  ctx.font = '16px "Courier New", monospace';
  ctx.fillText(`VISIONX HOLOGRAPHIC CAPTURE // ${new Date().toISOString()}`, 24, height - 24);

  const dataUrl = composite.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `${filenamePrefix}-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();

  return dataUrl;
}
