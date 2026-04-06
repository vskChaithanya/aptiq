require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');
const CodingQuestion = require('./models/CodingQuestion');

mongoose.connect(process.env.MONGO_URI);

const seedQuestions = [];

// --- MATH QUESTIONS ---
for (let i = 1; i <= 15; i++) {
  let num1 = 450 + (i * 17); let num2 = 6 + (i % 5);
  seedQuestions.push({ topic: 'division', level: 'level1', question: `Find the remainder when ${num1} is divided by ${num2}.`, options: [`A. ${num1 % num2}`, `B. ${(num1 % num2) + 1}`, `C. ${(num1 % num2) + 2}`, `D. 0`], answer: `A. ${num1 % num2}` });
}
for (let i = 1; i <= 15; i++) {
  let val1 = 12 + i; let val2 = 15 + (i * 2);
  seedQuestions.push({ topic: 'lcm', level: 'level1', question: `What is the Least Common Multiple (LCM) of ${val1} and ${val2}?`, options: ['A. 120', 'B. 180', 'C. 240', 'D. 360'], answer: 'B. 180' });
}
for (let i = 1; i <= 15; i++) {
  let target = 100 + (i * 50);
  seedQuestions.push({ topic: 'factors', level: 'level1', question: `How many total prime factors does the number ${target} have?`, options: ['A. 2', 'B. 3', 'C. 4', 'D. 5'], answer: 'C. 4' });
}
for (let i = 1; i <= 15; i++) {
  let base = 3 + (i % 6); let power = 45 + i;
  seedQuestions.push({ topic: 'lastdigit', level: 'level1', question: `Find the unit digit (last digit) of ${base}^${power}.`, options: ['A. 1', 'B. 3', 'C. 7', 'D. 9'], answer: 'C. 7' });
}

// --- NEW: PYTHON CODING QUESTIONS ---
const pythonQuestions = [
  { title: "Sum of Array", problemStatement: "Write a Python program to find the sum of all elements in a list. Read the integers separated by spaces.", sampleInput: "1 2 3 4 5", sampleOutput: "15" },
  { title: "Reverse String", problemStatement: "Write a Python program that takes a string input and prints it in reverse order.", sampleInput: "aptiq", sampleOutput: "qitpa" },
  { title: "Even or Odd", problemStatement: "Write a Python program that takes an integer and prints 'Even' if it is even, and 'Odd' if it is odd.", sampleInput: "4", sampleOutput: "Even" },
  { title: "Factorial", problemStatement: "Write a Python program to print the factorial of a given positive integer.", sampleInput: "5", sampleOutput: "120" },
  { title: "Vowel Count", problemStatement: "Write a Python program that counts the number of vowels (a, e, i, o, u) in a given string.", sampleInput: "education", sampleOutput: "5" }
];

async function runSeed() {
  try {
    await Question.deleteMany(); 
    await CodingQuestion.deleteMany(); // Clear old code questions

    await Question.insertMany(seedQuestions); 
    await CodingQuestion.insertMany(pythonQuestions); // Insert fresh code questions
    
    console.log(`🎉 Success! Inserted ${seedQuestions.length} Math MCQs and ${pythonQuestions.length} Python Coding Questions.`);
    process.exit();
  } catch (err) {
    console.error("Error seeding data: ", err);
    process.exit(1);
  }
}

runSeed();