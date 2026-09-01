export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/watch\?(?:.*&)?v=|youtube(?:-nocookie)?\.com\/(?:embed|shorts|live)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  // Bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
}
