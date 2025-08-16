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
    type: [String],
    default: []
  },
  isCommunity: {
    type: Boolean, 
    default: false
  },
  username: {
    type: String,   
    required: true  
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prompt', promptSchema);
