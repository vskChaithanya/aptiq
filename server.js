const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const User = require('./models/User');
const Question = require('./models/Question');
const Task = require('./models/Task');
const CodingQuestion = require('./models/CodingQuestion');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const JWT_SECRET = 'super_secret_aptiq_key_2026';

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aptiq.noreply@gmail.com', 
    pass: 'supsojhzmgxmujrg'    
  }
});

const registrationVault = {};
const forgotPasswordVault = {};

app.post('/api/register/send-otp', async (req, res) => {
  try {
    const { name, hallTicket, email, password, role } = req.body;
    
    // 🚨 UPDATED FACULTY VALIDATION HERE 🚨
    if (role === 'faculty' && email !== 'aptiq.noreply@gmail.com') {
        return res.status(400).json({ message: 'Faculty access is restricted to the admin email (aptiq.noreply@gmail.com).' });
    }
    if (role === 'student' && !email.endsWith('@sru.edu.in')) {
        return res.status(400).json({ message: 'Students MUST use an @sru.edu.in email address.' });
    }
    
    const existing = await User.findOne({ $or: [{ email }, { hallTicket }] });
    if (existing) return res.status(400).json({ message: 'Email or ID already registered.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registrationVault[email] = { otp, userData: { name, hallTicket, email, password, role } };

    try {
      await transporter.sendMail({
        from: '"AptIQ Support" <aptiq.noreply@gmail.com>', 
        to: email,
        subject: 'Welcome to AptIQ - Verify your Email',
        text: `Hello ${name},\n\nYour OTP to verify your email and complete your AptIQ registration is: ${otp}\n\nWelcome aboard!\n\n- The AptIQ Team`
      });
      res.json({ message: 'OTP sent to your email!' });
    } catch (emailErr) {
      console.log("🚨 NODEMAILER ERROR:", emailErr.message);
      return res.status(500).json({ message: 'Email failed to send. Check backend Gmail credentials.' });
    }

  } catch (err) { res.status(500).json({ message: 'Server error during registration setup.' }); }
});

app.post('/api/register/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const vaultRecord = registrationVault[email];

    if (vaultRecord && vaultRecord.otp === otp) {
      const { name, hallTicket, password, role } = vaultRecord.userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, hallTicket, email, password: hashedPassword, role: role || 'student' });
      await user.save();

      delete registrationVault[email]; 
      res.status(201).json({ message: 'Registration successful! You can now log in.' });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
  } catch (err) { res.status(500).json({ message: 'Server error during verification.' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found.' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, hallTicket: user.hallTicket, email: user.email, role: user.role || 'student', highestScore: user.highestScore, recentTest: user.recentTest, testHistory: user.testHistory } });
  } catch (err) { res.status(500).json({ message: 'Server error during login.' }); }
});

app.post('/api/forgot-password/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    forgotPasswordVault[email] = otp;

    try {
      await transporter.sendMail({
        from: '"AptIQ Support" <aptiq.noreply@gmail.com>', 
        to: email,
        subject: 'AptIQ Portal - Password Reset OTP',
        text: `Hello,\n\nYour OTP to reset your AptIQ password is: ${otp}\n\nIf you did not request this, please ignore this email.\n\n- The AptIQ Team`
      });
      res.json({ message: "OTP Sent successfully!" });
    } catch (emailErr) {
      console.log("🚨 NODEMAILER ERROR:", emailErr.message);
      return res.status(500).json({ message: 'Email failed to send. Check backend Gmail credentials.' });
    }

  } catch (err) { res.status(500).json({ message: "Server error." }); }
});

app.post('/api/forgot-password/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (forgotPasswordVault[email] && forgotPasswordVault[email] === otp) {
    res.json({ message: "OTP Verified! Proceed to reset password." });
  } else {
    res.status(400).json({ message: "Invalid or expired OTP." });
  }
});

app.post('/api/forgot-password/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (forgotPasswordVault[email] && forgotPasswordVault[email] === otp) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ email }, { password: hashedPassword });
      delete forgotPasswordVault[email]; 
      res.json({ message: "Password updated successfully! You can now log in." });
    } catch (err) { res.status(500).json({ message: "Failed to update password." }); }
  } else {
    res.status(400).json({ message: "Security error. Please try resetting again." });
  }
});

app.post('/api/save-score', async (req, res) => {
  const { token, score, codingScore, topicName, timeTaken } = req.body; 
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    user.recentTest = `${topicName} (${timeTaken})`;
    
    if (!topicName.startsWith('TASK:')) {
      if (score > (user.highestScore || 0)) user.highestScore = score;
    }
    
    user.testHistory.push({ 
      topic: topicName, 
      score: score, 
      codingScore: codingScore || 0, 
      date: new Date().toLocaleDateString(), 
      timeTaken: timeTaken 
    });
    
    await user.save();
    res.json({ message: 'Score saved!', user: { highestScore: user.highestScore, recentTest: user.recentTest, testHistory: user.testHistory } });
  } catch (err) { res.status(401).json({ message: 'Unauthorized' }); }
});

app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find({ topic: req.query.topic, level: req.query.level });
    res.json(questions);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

app.get('/api/coding-questions', async (req, res) => {
  try {
    const questions = await CodingQuestion.find({});
    res.json(questions);
  } catch (err) { res.status(500).json({ message: 'Error fetching coding questions.' }); }
});

app.post('/api/admin/tasks', async (req, res) => {
  try {
    const { title, codingIds } = req.body;
    if (!codingIds || codingIds.length !== 2) return res.status(400).json({ message: "You must select exactly 2 Python questions." });

    const topics = ['division', 'lcm', 'factors', 'lastdigit'];
    let taskQuestions = [];
    for (const topic of topics) {
      const qs = await Question.aggregate([{ $match: { topic: topic } }, { $sample: { size: 10 } }]);
      taskQuestions = taskQuestions.concat(qs);
    }
    const selectedCodingQuestions = await CodingQuestion.find({ _id: { $in: codingIds } });

    const newTask = new Task({ title: title, questions: taskQuestions, codingQuestions: selectedCodingQuestions });
    await newTask.save();
    res.status(201).json({ message: `Task assigned successfully!` });
  } catch (error) { res.status(500).json({ message: 'Failed to assign task.' }); }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ isActive: true }).select('-questions.answer');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: 'Error fetching tasks' }); }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    res.json(task);
  } catch (err) { res.status(500).json({ message: 'Task not found' }); }
});

app.delete('/api/admin/tasks/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const requestUser = await User.findById(decoded.userId);
    
    if (!requestUser || requestUser.role !== 'faculty') return res.status(403).json({ message: "Forbidden" });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) { res.status(500).json({ message: "Failed to delete task" }); }
});

app.get('/api/admin/students', async (req, res) => {
  try {
    const students = await User.find({});
    res.json(students);
  } catch (err) { res.status(500).json({ message: "Error fetching students" }); }
});

app.delete('/api/admin/students/:id', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const requestUser = await User.findById(decoded.userId);
    if (!requestUser || requestUser.role !== 'faculty') return res.status(403).json({ message: "Forbidden" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: "Delete failed" }); }
});

app.get('/', (req, res) => res.redirect('/login.html'));

// --- UPDATE THIS BLOCK ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});