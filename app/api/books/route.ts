import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';
import { parseRequestBody } from '@/lib/parseBody';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const books = await Book.find({});
    const formatted = books.map((b) => ({
      _id: b._id.toString(),
      title: b.title,
      commentcount: Array.isArray(b.comments) ? b.comments.length : 0,
    }));
    return Response.json(formatted);
  } catch (err) {
    return new Response('database error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await parseRequestBody(req);
    const title = body.title;

    if (title === undefined || title === null || title.toString().trim() === '') {
      return new Response('missing required field title', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    await connectDB();
    const newBook = new Book({
      title: title.toString().trim(),
      comments: [],
    });
    const saved = await newBook.save();

    return Response.json({
      _id: saved._id.toString(),
      title: saved.title,
    });
  } catch (err) {
    return new Response('error saving book', { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectDB();
    await Book.deleteMany({});
    return new Response('complete delete successful', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response('error deleting books', { status: 500 });
  }
}
