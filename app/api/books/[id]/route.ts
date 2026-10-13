import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Book } from '@/models/Book';
import { parseRequestBody } from '@/lib/parseBody';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response('no book exists', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    await connectDB();
    const book = await Book.findById(id);
    if (!book) {
      return new Response('no book exists', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return Response.json({
      _id: book._id.toString(),
      title: book.title,
      comments: Array.isArray(book.comments) ? book.comments : [],
    });
  } catch (err) {
    return new Response('no book exists', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await parseRequestBody(req);
  const comment = body.comment;

  if (comment === undefined || comment === null || comment.toString().trim() === '') {
    return new Response('missing required field comment', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response('no book exists', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    await connectDB();
    const book = await Book.findById(id);
    if (!book) {
      return new Response('no book exists', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    book.comments.push(comment.toString().trim());
    const updated = await book.save();

    return Response.json({
      _id: updated._id.toString(),
      title: updated.title,
      comments: updated.comments,
    });
  } catch (err) {
    return new Response('no book exists', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response('no book exists', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    await connectDB();
    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) {
      return new Response('no book exists', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return new Response('delete successful', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response('no book exists', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
