export const clampPosition = (x: number, y: number, isMobile: boolean) => {
  const sz = isMobile ? 64 : 54;
  const margin = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampedX = Math.min(Math.max(x, margin), vw - sz - margin);
  const clampedY = Math.min(Math.max(y, margin), vh - sz - margin);
  return { left: clampedX, top: clampedY };
};
