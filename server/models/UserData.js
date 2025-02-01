const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  sheetData: {
    type: Map,
    of: [{
      Name: String,
      Amount: Number,
      Date: Date,
      Verified: String,
    }],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('UserData', userDataSchema);