const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  tags: {
    type: [String], // array of tags
    default: []
  },
  isCommunity: {
    type: Boolean, // true if for community
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prompt', promptSchema);
