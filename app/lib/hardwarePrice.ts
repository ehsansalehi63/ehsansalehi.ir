export function applyHardwareMarkup(basePriceThousands: number): number {
  return Math.round(basePriceThousands * 1.1);
}

export function formatTomanFromThousands(amountThousands: number): string {
  const millions = Math.floor(amountThousands / 1000);
  const remainderThousands = amountThousands % 1000;

  if (millions <= 0) {
    return `${amountThousands.toLocaleString('fa-IR')} هزار تومان`;
  }

  if (remainderThousands === 0) {
    return `${millions.toLocaleString('fa-IR')} میلیون تومان`;
  }

  return `${millions.toLocaleString('fa-IR')} میلیون و ${remainderThousands.toLocaleString('fa-IR')} هزار تومان`;
}

export function formatHardwarePrice(basePriceThousands: number): string {
  return formatTomanFromThousands(applyHardwareMarkup(basePriceThousands));
}
