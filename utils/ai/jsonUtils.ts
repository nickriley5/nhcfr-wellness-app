export function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }

  return cleaned.trim();
}

export function parseCleanJsonResponse<T = unknown>(text: string): T {
  const cleaned = cleanJsonResponse(text);
  return JSON.parse(cleaned) as T;
}
