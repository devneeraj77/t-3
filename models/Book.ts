import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBook extends Document {
  title: string;
  comments: string[];
}

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    comments: {
      type: [String],
      default: [],
    },
  },
  {
    versionKey: false,
  }
);

export const Book: Model<IBook> =
  mongoose.models && mongoose.models.Book
    ? (mongoose.models.Book as Model<IBook>)
    : mongoose.model<IBook>('Book', BookSchema);

export default Book;
