export function rgbToHex({ r, g, b }) {
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function shadeHex(hex, amount) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const adjust = (channel) =>
    Math.min(255, Math.max(0, Math.round(channel + (255 - channel) * amount)));

  return rgbToHex({
    r: amount >= 0 ? adjust(r) : Math.round(r * (1 + amount)),
    g: amount >= 0 ? adjust(g) : Math.round(g * (1 + amount)),
    b: amount >= 0 ? adjust(b) : Math.round(b * (1 + amount)),
  });
}
