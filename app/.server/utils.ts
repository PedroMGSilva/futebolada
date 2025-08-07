export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
  return null;
}
