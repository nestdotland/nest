export function prettyBytes(n: number | null): string {
  if (n === null) return "unknown";
  const log = Math.floor(Math.log10(n) / 3);
  let suffix: string;
  switch (log) {
    case 0:
      suffix = "B";
      break;
    case 1:
      suffix = "kB";
      break;
    case 2:
      suffix = "MB";
      break;
    case 3:
      suffix = "GB";
      break;
    case 4:
      suffix = "PB";
      break;
    default:
      suffix = "?";
      break;
  }
  return (n / 10 ** (log * 3)).toPrecision(3) + suffix;
}
