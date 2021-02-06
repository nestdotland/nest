export function shift<T extends unknown[]>(array: T): T {
  const copy = [...array] as T;
  copy.shift();
  return copy;
}
