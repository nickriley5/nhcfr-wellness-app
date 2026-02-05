let lastRequestTime = 0;
const MIN_REQUEST_DELAY = 1800; // 1.8 seconds between requests

export async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_DELAY) {
    const waitTime = MIN_REQUEST_DELAY - timeSinceLastRequest;
    console.log(`⏱️  Rate limit: waiting ${waitTime}ms before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}
