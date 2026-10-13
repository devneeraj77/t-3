import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf8');
    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response('Not found', { status: 404 });
  }
}
