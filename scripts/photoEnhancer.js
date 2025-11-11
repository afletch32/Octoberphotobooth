const DEFAULT_ENHANCEMENT_OPTIONS = Object.freeze({
  enabled: true,
  brightness: 0.06,
  contrast: 0.12,
  sharpness: 0.25,
});

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeEnhancementOptions(options = {}) {
  const normalized = {
    enabled: typeof options.enabled === 'boolean' ? options.enabled : DEFAULT_ENHANCEMENT_OPTIONS.enabled,
    brightness: DEFAULT_ENHANCEMENT_OPTIONS.brightness,
    contrast: DEFAULT_ENHANCEMENT_OPTIONS.contrast,
    sharpness: DEFAULT_ENHANCEMENT_OPTIONS.sharpness,
  };

  if (options && typeof options === 'object') {
    if (options.brightness !== undefined) {
      normalized.brightness = clamp(Number(options.brightness), -0.5, 0.5);
    }
    if (options.contrast !== undefined) {
      normalized.contrast = clamp(Number(options.contrast), -0.5, 0.5);
    }
    if (options.sharpness !== undefined) {
      normalized.sharpness = clamp(Number(options.sharpness), 0, 1);
    }
  }

  return normalized;
}

function applyBrightnessContrast(data, brightness, contrast) {
  if (!data) return;
  if (brightness === 0 && contrast === 0) return;

  const offset = brightness * 255;
  const factor = Math.max(0, 1 + contrast);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const value = data[i + c] * factor + offset;
      data[i + c] = clamp(value, 0, 255);
    }
  }
}

function applySharpen(data, width, height, amount) {
  if (!data || amount <= 0) return;
  const w4 = width * 4;
  const copy = new Uint8ClampedArray(data);
  const edgeWeight = -amount;
  const centerWeight = 1 + 4 * amount;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * w4 + x * 4;
      for (let c = 0; c < 3; c++) {
        const value = (
          copy[idx + c] * centerWeight +
          copy[idx - 4 + c] * edgeWeight +
          copy[idx + 4 + c] * edgeWeight +
          copy[idx - w4 + c] * edgeWeight +
          copy[idx + w4 + c] * edgeWeight
        );
        data[idx + c] = clamp(value, 0, 255);
      }
      data[idx + 3] = copy[idx + 3];
    }
  }
}

function applyEnhancements(canvas, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') {
    return canvas;
  }

  const settings = normalizeEnhancementOptions({ ...DEFAULT_ENHANCEMENT_OPTIONS, ...options });
  if (!settings.enabled) {
    return canvas;
  }

  if (
    settings.brightness === 0 &&
    settings.contrast === 0 &&
    settings.sharpness === 0
  ) {
    return canvas;
  }

  const target = document.createElement('canvas');
  target.width = canvas.width;
  target.height = canvas.height;
  const ctx = target.getContext('2d');
  if (!ctx) {
    return canvas;
  }
  ctx.drawImage(canvas, 0, 0);

  if (target.width === 0 || target.height === 0) {
    return canvas;
  }

  const imageData = ctx.getImageData(0, 0, target.width, target.height);
  const { data } = imageData;

  applyBrightnessContrast(data, settings.brightness, settings.contrast);
  applySharpen(data, target.width, target.height, settings.sharpness);

  ctx.putImageData(imageData, 0, 0);
  return target;
}

export { applyEnhancements, DEFAULT_ENHANCEMENT_OPTIONS, normalizeEnhancementOptions };
