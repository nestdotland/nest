import { bold, underline } from "../deps.ts";

/** Underline & bold */
export function underlineBold(msg: string) {
  return underline(bold(msg));
}

/** Returns the most likely string in the array if the distance is >= 0.6 */
export function likelyString(str: string, array: string[]): string | undefined {
  const sorted = levenshteinSort(str, array);
  const likely = sorted[sorted.length - 1];
  return levenshtein(str, likely) >= 0.6 ? likely : undefined;
}

/** Computes the Levenshtein distance between two strings */
export function levenshtein(s1: string, s2: string): number {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - distance(longer, shorter)) / longerLength;
}

/** Efficient levenshtein sort */
export function levenshteinSort(s: string, array: string[]) {
  return array
    .map((value) => [levenshtein(s, value), value] as [number, string])
    .sort(([a], [b]) => a - b)
    .map(([_, str]) => str);
}

function distance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          const c1 = s1.charAt(i - 1);
          const c2 = s2.charAt(j - 1);
          if (c1 !== c2) {
            const min = Math.min(Math.min(newValue, lastValue), costs[j]);
            if (c1.toLowerCase() === c2.toLowerCase()) {
              newValue = min + 0.3;
            } else {
              newValue = min + 1;
            }
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}
