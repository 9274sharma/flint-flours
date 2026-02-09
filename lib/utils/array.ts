/**
 * Shuffle array using Fisher-Yates and return first `count` elements
 */
export function shuffleAndTake<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
