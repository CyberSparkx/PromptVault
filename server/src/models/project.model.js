const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectname: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  },
  prompts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prompt',
      default: [] 
    }
  ]
});

module.exports = mongoose.model('Project', projectSchema);
