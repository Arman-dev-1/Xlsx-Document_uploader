const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  sheetName: {
    type: String,
    required: true,
  },
  importedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Record', recordSchema);