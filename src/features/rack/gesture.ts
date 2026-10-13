export function clampIndex(index: number, count: number) {
  return Math.max(0, Math.min(Math.max(0, count - 1), index));
}

export function nextIndexAfterDrag(index: number, count: number, slot: number, offsetX: number, velocityX: number) {
  if (slot <= 0 || count < 2) return clampIndex(index, count);
  const projected = offsetX + velocityX * 0.16;
  if (Math.abs(projected) < Math.max(28, slot * 0.18)) return clampIndex(index, count);
  const steps = Math.max(1, Math.min(2, Math.round(Math.abs(projected) / slot)));
  return clampIndex(index - Math.sign(projected) * steps, count);
}

export function boundedDragOffset(index: number, count: number, offsetX: number) {
  const outward = (index === 0 && offsetX > 0) || (index === count - 1 && offsetX < 0);
  return outward ? Math.sign(offsetX) * Math.min(30, Math.abs(offsetX) * 0.1) : offsetX;
}
