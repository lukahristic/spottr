export function dicebearUrl(seed: string, size = 200): string {
  return `https://api.dicebear.com/9.x/thumbs/png?seed=${encodeURIComponent(seed)}&size=${size}`
}
