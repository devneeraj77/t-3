export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  return Response.json({
    headers: headersObj,
    status: 'ok',
  });
}
