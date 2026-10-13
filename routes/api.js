/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const mongoose = require('mongoose');
const Book = require('../models/Book');

module.exports = function (app) {

  app.route('/api/books')
    .get(async function (req, res){
      try {
        const books = await Book.find({});
        const responseData = books.map(book => ({
          _id: book._id,
          title: book.title,
          commentcount: Array.isArray(book.comments) ? book.comments.length : 0
        }));
        return res.json(responseData);
      } catch (err) {
        return res.status(500).send('database error');
      }
    })
    
    .post(async function (req, res){
      const title = req.body ? req.body.title : undefined;
      if (title === undefined || title === null || title.toString().trim() === '') {
        return res.send('missing required field title');
      }

      try {
        const newBook = new Book({
          title: title.toString().trim(),
          comments: []
        });
        const savedBook = await newBook.save();
        return res.json({
          _id: savedBook._id,
          title: savedBook.title
        });
      } catch (err) {
        return res.status(500).send('error saving book');
      }
    })
    
    .delete(async function(req, res){
      try {
        await Book.deleteMany({});
        return res.send('complete delete successful');
      } catch (err) {
        return res.status(500).send('error deleting books');
      }
    });

  app.route('/api/books/:id')
    .get(async function (req, res){
      const bookid = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(bookid)) {
        return res.send('no book exists');
      }

      try {
        const book = await Book.findById(bookid);
        if (!book) {
          return res.send('no book exists');
        }
        return res.json({
          _id: book._id,
          title: book.title,
          comments: Array.isArray(book.comments) ? book.comments : []
        });
      } catch (err) {
        return res.send('no book exists');
      }
    })
    
    .post(async function(req, res){
      const bookid = req.params.id;
      const comment = req.body ? req.body.comment : undefined;

      if (comment === undefined || comment === null || comment.toString().trim() === '') {
        return res.send('missing required field comment');
      }

      if (!mongoose.Types.ObjectId.isValid(bookid)) {
        return res.send('no book exists');
      }

      try {
        const book = await Book.findById(bookid);
        if (!book) {
          return res.send('no book exists');
        }

        book.comments.push(comment.toString().trim());
        const updatedBook = await book.save();

        return res.json({
          _id: updatedBook._id,
          title: updatedBook.title,
          comments: updatedBook.comments
        });
      } catch (err) {
        return res.send('no book exists');
      }
    })
    
    .delete(async function(req, res){
      const bookid = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(bookid)) {
        return res.send('no book exists');
      }

      try {
        const deletedBook = await Book.findByIdAndDelete(bookid);
        if (!deletedBook) {
          return res.send('no book exists');
        }
        return res.send('delete successful');
      } catch (err) {
        return res.send('no book exists');
      }
    });
  
};
