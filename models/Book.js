const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  comments: {
    type: [String],
    default: []
  }
}, {
  versionKey: false
});

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);
