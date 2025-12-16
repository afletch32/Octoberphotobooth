const DEFAULT_FRAME_INTERVAL = 80; // ~12.5 fps capture
const DEFAULT_PLAYBACK_FPS = 24;
const DEFAULT_BOOMERANG_DURATION = 1400;
const DEFAULT_360_DURATION = 6000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pickMime(preferred) {
  if (preferred && typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(preferred)) {
    return preferred;
  }
  const fallbacks = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];
  for (const type of fallbacks) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return preferred || '';
}

function startRecorder(stream, mimeType) {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder not supported in this browser');
  }
  const options = mimeType ? { mimeType } : undefined;
  const recorder = new MediaRecorder(stream, options);
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size) {
      chunks.push(event.data);
    }
  };
  return { recorder, chunks };
}

async function recordFrames({
  captureFrame,
  durationMs = DEFAULT_BOOMERANG_DURATION,
  frameIntervalMs = DEFAULT_FRAME_INTERVAL
}) {
  const frames = [];
  const start = performance.now();
  while (performance.now() - start < durationMs) {
    // eslint-disable-next-line no-await-in-loop
    const frame = await captureFrame();
    if (frame) {
      frames.push(frame);
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(frameIntervalMs);
  }
  return frames;
}

async function encodeFrames(frames, {
  mimeType,
  fps = DEFAULT_PLAYBACK_FPS,
  bounce = false
} = {}) {
  if (!frames.length) {
    throw new Error('No frames captured');
  }
  const canvas = document.createElement('canvas');
  canvas.width = frames[0].width;
  canvas.height = frames[0].height;
  const ctx = canvas.getContext('2d');

  const sequence = bounce
    ? frames.concat(frames.slice(1, -1).reverse())
    : frames.slice();

  const stream = canvas.captureStream(fps);
  const { recorder, chunks } = startRecorder(stream, pickMime(mimeType));
  const stopPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = (event) => reject(event.error || event);
  });

  recorder.start();
  const frameDelay = 1000 / fps;
  for (const frame of sequence) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line no-await-in-loop
    await sleep(frameDelay);
  }
  // Give the recorder one extra beat to flush the last frame
  await sleep(frameDelay);
  recorder.stop();
  await stopPromise;

  const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
  const url = URL.createObjectURL(blob);
  const poster = (() => {
    try {
      return frames[0].toDataURL('image/png');
    } catch (_) {
      return '';
    }
  })();

  return { blob, url, mimeType: blob.type || recorder.mimeType || mimeType || 'video/webm', poster, revocable: true };
}

export async function captureBoomerang({
  captureFrame,
  durationMs = DEFAULT_BOOMERANG_DURATION,
  frameIntervalMs = DEFAULT_FRAME_INTERVAL,
  mimeType,
  fps = DEFAULT_PLAYBACK_FPS
}) {
  if (typeof captureFrame !== 'function') {
    throw new Error('captureFrame callback is required for captureBoomerang');
  }
  const frames = await recordFrames({ captureFrame, durationMs, frameIntervalMs });
  return encodeFrames(frames, { mimeType, fps, bounce: true });
}

export async function captureTimedClip({
  stream,
  durationMs = DEFAULT_360_DURATION,
  mimeType
}) {
  if (!stream) {
    throw new Error('Media stream required for video capture');
  }
  const type = pickMime(mimeType);
  const { recorder, chunks } = startRecorder(stream, type);
  const stopPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = (event) => reject(event.error || event);
  });

  recorder.start(250);
  await sleep(durationMs);
  if (recorder.state !== 'inactive') {
    recorder.stop();
  }
  await stopPromise;

  const blob = new Blob(chunks, { type: recorder.mimeType || type || 'video/webm' });
  const url = URL.createObjectURL(blob);
  return {
    blob,
    url,
    mimeType: blob.type || recorder.mimeType || type || 'video/webm',
    revocable: true
  };
}

export async function captureStitched360({
  stream,
  durationMs = DEFAULT_360_DURATION,
  segmentMs = 2000,
  mimeType
}) {
  const type = pickMime(mimeType);
  const { recorder, chunks } = startRecorder(stream, type);
  const stopPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = (event) => reject(event.error || event);
  });

  recorder.start(Math.min(segmentMs, durationMs));
  await sleep(durationMs);
  if (recorder.state !== 'inactive') {
    recorder.stop();
  }
  await stopPromise;

  const blob = new Blob(chunks, { type: recorder.mimeType || type || 'video/webm' });
  const url = URL.createObjectURL(blob);
  return {
    blob,
    url,
    mimeType: blob.type || recorder.mimeType || type || 'video/webm',
    revocable: true
  };
}

export function mediaRecorderSupported() {
  return typeof MediaRecorder !== 'undefined';
}

