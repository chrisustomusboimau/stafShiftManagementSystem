export const TIME_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const startH = Math.floor(i / 2);
  const startM = i % 2 === 0 ? 0 : 30;
  const endTotal = i + 1;
  const endH = Math.floor(endTotal / 2) % 24;
  const endM = endTotal % 2 === 0 ? 0 : 30;
  const pad = (n: number) => String(n).padStart(2, "0");
  const endHH = endTotal === 48 ? "24" : pad(endH);
  return `${pad(startH)}:${pad(startM)}-${endHH}:${pad(endM)}`;
});
