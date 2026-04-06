const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hallTicket: { type: String, required: true, unique: true }, // Acts as Emp ID for Faculty
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'student' }, // NEW: Separates Students & Faculty
  
  // Test Data
  highestScore: { type: Number, default: 0 },
  recentTest: { type: String, default: 'None' },
  testHistory: { type: Array, default: [] },
  
  // Password Reset Data
  resetOtp: { type: String },
  otpExpiry: { type: Date }
});

module.exports = mongoose.model('User', userSchema);