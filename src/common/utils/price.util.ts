export function formatPrice(price: number, currency = 'تومان'): string {
  const formattedNumber = new Intl.NumberFormat('fa-IR').format(price);
  return `${formattedNumber} ${currency}`;
}

export function toRial(toman: number): number {
  return toman * 10;
}

export function toToman(rial: number): number {
  return Math.floor(rial / 10);
}

export function calculateDiscount(
  originalPrice: number,
  discountPercent: number,
): number {
  return Math.floor(originalPrice * (1 - discountPercent / 100));
}

export function calculateDiscountAmount(
  originalPrice: number,
  discountPercent: number,
): number {
  return Math.floor(originalPrice * (discountPercent / 100));
}
