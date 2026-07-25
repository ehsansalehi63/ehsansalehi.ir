/** Fetch public news without using the browser, Next.js, or LiteSpeed cache. */
export function fetchLiveNews(params: Record<string, string | number>): Promise<Response> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value));
  }
  searchParams.set('_', String(Date.now()));

  return fetch(`/api/news?${searchParams.toString()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
}
