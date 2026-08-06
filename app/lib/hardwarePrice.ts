export function applyHardwareMarkup(basePriceThousands: number): number {
  return Math.round(basePriceThousands * 1.1);
}

export function formatTomanFromThousands(amountThousands: number): string {
  const amountTomans = amountThousands * 1000;
  return `${amountTomans.toLocaleString('fa-IR')} تومان`;
}

export function formatHardwarePrice(basePriceThousands: number): string {
  return formatTomanFromThousands(applyHardwareMarkup(basePriceThousands));
}
