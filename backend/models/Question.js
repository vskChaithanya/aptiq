const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  topic: { type: String, required: true }, // e.g., 'division', 'lcm'
  level: { type: String, required: true }, // e.g., 'level1', 'level2'
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true }
});

module.exports = mongoose.model('Question', questionSchema);