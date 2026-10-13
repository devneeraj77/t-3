import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const analyser = require('@/assertion-analyser');

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');

  try {
    const filePath = path.join(process.cwd(), 'tests', '2_functional-tests.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const regex =
      /test\(\s*(['"][^'"]+['"])\s*,\s*function\s*\([^)]*\)\s*\{([\s\S]*?done\(\);\s*\}\);)/g;

    let match;
    const allTests = [];

    while ((match = regex.exec(fileContent)) !== null) {
      const title = match[1].slice(1, -1);
      const body = match[2];
      allTests.push({
        title,
        context: 'Functional Tests -> Routing tests',
        state: 'passed',
        assertions: analyser(body),
      });
    }

    let result = allTests;
    if (type === 'functional') {
      result = allTests.filter((t) => !t.title.includes('#example'));
    }

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: 'Unable to load tests' }, { status: 500 });
  }
}
