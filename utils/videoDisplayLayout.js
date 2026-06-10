/**
 * Вписывает видео в рамку, сохраняя пропорции исходного файла (без обрезки).
 */
export function fitVideoInBounds(videoWidth, videoHeight, maxWidth, maxHeight) {
  if (!maxWidth || !maxHeight) {
    return { width: 0, height: 0, hasNativeSize: false };
  }

  if (!videoWidth || !videoHeight) {
    return {
      width: maxWidth,
      height: maxHeight,
      hasNativeSize: false,
    };
  }

  const ratio = videoWidth / videoHeight;
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    hasNativeSize: true,
    sourceWidth: videoWidth,
    sourceHeight: videoHeight,
  };
}
