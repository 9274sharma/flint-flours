/**
 * Calculate final price after applying discount percentage
 */
export function getFinalPrice(price: number, discountPercent: number): number {
  return price - (price * discountPercent) / 100;
}
