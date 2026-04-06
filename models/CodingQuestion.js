const mongoose = require('mongoose');

const codingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  problemStatement: { type: String, required: true },
  sampleInput: { type: String },
  sampleOutput: { type: String, required: true },
  testCases: [{ input: String, expectedOutput: String }] 
});

module.exports = mongoose.model('CodingQuestion', codingSchema);