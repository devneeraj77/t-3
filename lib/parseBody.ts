export async function parseRequestBody(req: Request): Promise<Record<string, any>> {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await req.json();
    }
    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();
      const result: Record<string, any> = {};
      formData.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    const text = await req.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      const params = new URLSearchParams(text);
      const result: Record<string, any> = {};
      params.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
  } catch {
    return {};
  }
}
