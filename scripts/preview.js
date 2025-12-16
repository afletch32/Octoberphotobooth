export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    try {
      if (location.protocol.startsWith("http")) img.crossOrigin = "anonymous";
    } catch (_) {}
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function getAspectRatioFromImage(imgSrc) {
  try {
    const img = await loadImage(imgSrc);
    if (img.naturalWidth && img.naturalHeight) {
      return img.naturalWidth / img.naturalHeight;
    }
  } catch (e) {
    console.error("Failed to get aspect ratio from image", imgSrc, e);
  }
  return null;
}

export function orientationFromTemplate(template) {
  const layout = (template && template.layout ? template.layout : "").toLowerCase();
  if (
    layout === "double_column" ||
    layout === "double-column" ||
    layout === "vertical"
  ) {
    return "view-portrait";
  }
  return "view-landscape";
}

export async function setViewOrientation(imgSrc, context) {
  const { videoWrap, setCaptureAspect, updateCaptureAspect } = context;
  if (!videoWrap) return;
  const aspect = await getAspectRatioFromImage(imgSrc);
  if (aspect) {
    const orientation = aspect > 1 ? "landscape" : "portrait";
    videoWrap.className = `view-${orientation}`;
    if (typeof setCaptureAspect === "function") setCaptureAspect(aspect);
  } else {
    videoWrap.className = "view-landscape";
    if (typeof setCaptureAspect === "function") setCaptureAspect(null);
    if (typeof updateCaptureAspect === "function") updateCaptureAspect();
  }
}

export function applyPreviewOrientation(context) {
  const {
    videoWrap,
    mode,
    activeTheme,
    pendingTemplate,
    selectedOverlay,
    setCaptureAspect,
    updateCaptureAspect,
    getTemplateList,
    getOverlayList,
  } = context;
  if (!videoWrap) return;
  if (mode === "strip") {
    const templates = typeof getTemplateList === "function" ? getTemplateList(activeTheme) : null;
    const template =
      pendingTemplate || (Array.isArray(templates) ? templates[0] : null);
    videoWrap.className = orientationFromTemplate(template);
    return;
  }
  const overlays = typeof getOverlayList === "function" ? getOverlayList(activeTheme) : null;
  const firstOverlay = Array.isArray(overlays) && overlays.length ? overlays[0] : null;
  const overlaySrc =
    selectedOverlay ||
    (firstOverlay && (typeof firstOverlay === "string" ? firstOverlay : firstOverlay.src));
  if (overlaySrc) {
    setViewOrientation(overlaySrc, {
      videoWrap,
      setCaptureAspect,
      updateCaptureAspect,
    }).catch(() => {
      videoWrap.className = "view-landscape";
      if (typeof setCaptureAspect === "function") setCaptureAspect(null);
      if (typeof updateCaptureAspect === "function") updateCaptureAspect();
    });
  } else {
    videoWrap.className = "view-landscape";
    if (typeof setCaptureAspect === "function") setCaptureAspect(null);
    if (typeof updateCaptureAspect === "function") updateCaptureAspect();
  }
}

export function capturePreviewState({ liveOverlay, videoWrap }) {
  return {
    overlaySrc: liveOverlay ? liveOverlay.src : "",
    overlayOpacity: liveOverlay ? liveOverlay.style.opacity : "",
    overlayDisplay: liveOverlay ? liveOverlay.style.display : "",
    videoClass: videoWrap ? videoWrap.className : "view-landscape",
  };
}

export function restorePreviewState(state, { liveOverlay, videoWrap }) {
  if (!state) return;
  if (liveOverlay) {
    liveOverlay.src = state.overlaySrc || "";
    liveOverlay.style.opacity = state.overlayOpacity || "";
    liveOverlay.style.display = state.overlayDisplay || "";
    liveOverlay.style.filter = "";
  }
  if (videoWrap) videoWrap.className = state.videoClass || "view-landscape";
}

export function toNumber(val, fallback) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function getStripTemplatePercents(template) {
  const headerPct = Math.max(
    0,
    Math.min(
      0.5,
      toNumber(template && (template.headerPct || template.header_percent), 0.2),
    ),
  );
  const columnPadPct = Math.max(
    0,
    Math.min(0.2, toNumber(template && template.columnPadPct, 0.055)),
  );
  const slotSpacingPct = Math.max(
    0,
    Math.min(0.2, toNumber(template && template.slotSpacingPct, 0.022)),
  );
  const footerPct = Math.max(
    0,
    Math.min(0.3, toNumber(template && template.footerPct, 0.03)),
  );

  return { headerPct, columnPadPct, slotSpacingPct, footerPct };
}

export function detectDoubleColumnSlots(img, rows) {
  try {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    const cols = 2;
    const colWidth = w / cols;
    const marginX = Math.max(2, Math.floor(colWidth * 0.08));
    const stepX = Math.max(1, Math.floor(colWidth / 80));
    const alphaThreshold = 32;
    const minSlotHeight = Math.max(10, Math.floor(h * 0.08));
    const expandY = Math.floor(h * 0.005);
    const results = Array.from({ length: cols }, () => []);

    for (let col = 0; col < cols; col++) {
      const xStart = Math.max(0, Math.floor(col * colWidth + marginX));
      const xEnd = Math.min(w - 1, Math.floor((col + 1) * colWidth - marginX));
      let inSlot = false;
      let slotStart = 0;
      for (let y = 0; y < h; y++) {
        let alphaSum = 0;
        let count = 0;
        for (let x = xStart; x <= xEnd; x += stepX) {
          alphaSum += data[(y * w + x) * 4 + 3];
          count++;
        }
        const avgAlpha = alphaSum / (count || 1);
        if (!inSlot && avgAlpha < alphaThreshold) {
          inSlot = true;
          slotStart = y;
        } else if (inSlot && avgAlpha >= alphaThreshold) {
          const slotHeight = y - slotStart;
          if (slotHeight >= minSlotHeight) {
            const y1 = Math.max(0, slotStart - expandY);
            const y2 = Math.min(h, y + expandY);
            results[col].push({
              x: col * colWidth + marginX,
              y: y1,
              w: colWidth - marginX * 2,
              h: Math.max(1, y2 - y1),
            });
          }
          inSlot = false;
        }
      }
      if (inSlot) {
        const slotHeight = h - slotStart;
        if (slotHeight >= minSlotHeight) {
          const y1 = Math.max(0, slotStart - expandY);
          const y2 = h;
          results[col].push({
            x: col * colWidth + marginX,
            y: y1,
            w: colWidth - marginX * 2,
            h: Math.max(1, y2 - y1),
          });
        }
      }
      results[col].sort((a, b) => a.y - b.y);
      if (results[col].length > rows) {
        results[col] = results[col].slice(0, rows);
      }
    }

    if (results.every((arr) => arr.length === rows)) {
      return results;
    }
    return null;
  } catch (e) {
    console.warn("Slot detection failed", e);
    return null;
  }
}

export async function getStripTemplateMetrics(template) {
  if (!template || !template.src) return null;
  if (template.__slotMetrics) return template.__slotMetrics;
  const metrics = { ...getStripTemplatePercents(template) };
  const img = await loadImage(template.src);
  const slots = detectDoubleColumnSlots(img, 3);
  if (slots) metrics.slots = slots;
  const { headerPct, columnPadPct, slotSpacingPct, footerPct } = metrics;
  if (slots && slots[0] && slots[0][0]) {
    metrics.aspect = Math.max(0.1, slots[0][0].w / slots[0][0].h);
  } else {
    const cols = 2;
    const columnW = 1 / cols;
    const slotWRel = columnW - columnPadPct * columnW * 2;
    const slotHRel = (1 - headerPct - footerPct - slotSpacingPct * (3 + 1)) / 3;
    metrics.aspect = Math.max(0.1, slotWRel / slotHRel);
  }
  template.__slotMetrics = metrics;
  return metrics;
}
