const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  questions: { type: Array, default: [] }, // Holds the 40 MCQs
  codingQuestions: { type: Array, default: [] }, // NEW: Holds the 2 Python questions
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);