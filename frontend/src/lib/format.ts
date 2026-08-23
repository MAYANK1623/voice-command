// Shared by ProductRow, ItemCard, and CartTotal — one "$X.XX" formatter
// instead of three copies drifting apart.
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}
