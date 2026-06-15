const mongoose = require('mongoose');
require('dotenv').config();
// Define Schema
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  topic: String,
  level: String
});
const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

// --- MATH ENGINE HELPERS ---
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }
function countFactors(n) {
  let count = 0;
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      count++;
      if (i !== n / i) count++;
    }
  }
  return count;
}
function lastDigitExp(base, exp) {
  if (exp === 0) return 1;
  const lastBase = base % 10;
  let cycle = [];
  let curr = lastBase;
  while (!cycle.includes(curr)) {
    cycle.push(curr);
    curr = (curr * lastBase) % 10;
  }
  const rem = exp % cycle.length;
  return rem === 0 ? cycle[cycle.length - 1] : cycle[rem - 1];
}

// Option Formatter (Shuffles and adds A, B, C, D)
function formatOptions(correct, wrong1, wrong2, wrong3) {
  let all = [correct, wrong1, wrong2, wrong3];
  // Shuffle array
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  let formatted = [];
  let answerString = "";
  const letters = ['A. ', 'B. ', 'C. ', 'D. '];
  all.forEach((val, idx) => {
    let text = letters[idx] + val;
    formatted.push(text);
    if (val === correct) answerString = text;
  });
  return { options: formatted, answer: answerString };
}

function getWrongDigits(correct) {
  let wrongs = [];
  while(wrongs.length < 3) {
    let r = randomInt(0, 9);
    if(r !== correct && !wrongs.includes(r)) wrongs.push(r);
  }
  return wrongs;
}

// --- GENERATOR SCRIPT ---
async function generateQuestions() {
  const questions = [];
  const levels = ['Easy', 'Medium', 'Hard'];
  const questionsPerLevel = 15;

  console.log(`⚙️ Booting Math Engine... Generating ${questionsPerLevel * 3 * 4} questions...`);

  // 1. DIVISION
  levels.forEach(level => {
    for (let i = 0; i < questionsPerLevel; i++) {
      let num = level === 'Easy' ? randomInt(50, 200) : (level === 'Medium' ? randomInt(200, 999) : randomInt(1000, 5000));
      let div = level === 'Easy' ? randomInt(3, 9) : (level === 'Medium' ? randomInt(11, 19) : randomInt(21, 50));
      let ans = num % div;
      
      let qText = level === 'Hard' 
        ? `A number when divided by ${div * randomInt(2,4)} leaves a remainder of ${ans + div}. What is the remainder when the same number is divided by ${div}?`
        : `What is the remainder when ${num} is divided by ${div}?`;

      let optData = formatOptions(ans, ans+1, Math.abs(ans-1), ans+2);
      questions.push({ question: qText, options: optData.options, answer: optData.answer, topic: 'division', level: level });
    }
  });

  // 2. LCM & HCF
  levels.forEach(level => {
    for (let i = 0; i < questionsPerLevel; i++) {
      let a = randomInt(4, 15);
      let b = randomInt(6, 20);
      let c = randomInt(10, 25);
      
      if (level === 'Easy') {
        let ans = lcm(a, b);
        let optData = formatOptions(ans, ans+a, ans-b>0?ans-b:ans+b, ans*2);
        questions.push({ question: `Find the LCM of ${a} and ${b}.`, options: optData.options, answer: optData.answer, topic: 'lcm', level: level });
      } else if (level === 'Medium') {
        let ans = lcm(lcm(a, b), c);
        let optData = formatOptions(ans, ans+10, ans-5>0?ans-5:ans+5, Math.floor(ans*1.5));
        questions.push({ question: `What is the lowest common multiple of ${a}, ${b}, and ${c}?`, options: optData.options, answer: optData.answer, topic: 'lcm', level: level });
      } else {
        let ans = gcd(a*5, b*5);
        let optData = formatOptions(ans, ans+1, ans+2, ans+3);
        questions.push({ question: `Find the Highest Common Factor (HCF) of ${a*5} and ${b*5}.`, options: optData.options, answer: optData.answer, topic: 'lcm', level: level });
      }
    }
  });

  // 3. FACTORS
  levels.forEach(level => {
    for (let i = 0; i < questionsPerLevel; i++) {
      let n = level === 'Easy' ? randomInt(10, 50) : (level === 'Medium' ? randomInt(50, 200) : randomInt(200, 600));
      let ans = countFactors(n);
      let optData = formatOptions(ans, ans+1, Math.abs(ans-1)>0?ans-1:ans+2, ans+3);
      questions.push({ question: `How many total factors does the number ${n} have?`, options: optData.options, answer: optData.answer, topic: 'factors', level: level });
    }
  });

  // 4. LAST DIGIT
  levels.forEach(level => {
    for (let i = 0; i < questionsPerLevel; i++) {
      let base = level === 'Easy' ? randomInt(2, 9) : randomInt(12, 99);
      let exp = level === 'Easy' ? randomInt(10, 40) : randomInt(50, 250);
      
      if (level === 'Hard') {
        let base2 = randomInt(2, 9);
        let exp2 = randomInt(20, 100);
        let ans = (lastDigitExp(base, exp) * lastDigitExp(base2, exp2)) % 10;
        let wrongs = getWrongDigits(ans);
        let optData = formatOptions(ans, wrongs[0], wrongs[1], wrongs[2]);
        questions.push({ question: `Find the unit digit of the product (${base}^${exp}) × (${base2}^${exp2}).`, options: optData.options, answer: optData.answer, topic: 'lastdigit', level: level });
      } else {
        let ans = lastDigitExp(base, exp);
        let wrongs = getWrongDigits(ans);
        let optData = formatOptions(ans, wrongs[0], wrongs[1], wrongs[2]);
        questions.push({ question: `What is the last digit (unit digit) of ${base}^${exp}?`, options: optData.options, answer: optData.answer, topic: 'lastdigit', level: level });
      }
    }
  });

  return questions;
}

// --- DATABASE EXECUTION ---
async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB...");
    
    // Clear out old practice questions so we don't get duplicates
    console.log("🗑️ Clearing old practice questions...");
    await Question.deleteMany({ topic: { $in: ['division', 'lcm', 'factors', 'lastdigit'] } });
    
    // Generate and Insert
    const newQuestions = await generateQuestions();
    await Question.insertMany(newQuestions);
    
    console.log(`🎉 SUCCESS: Injected ${newQuestions.length} mathematically accurate questions into the database!`);
    process.exit();
  } catch (err) {
    console.error("🚨 Error seeding:", err);
    process.exit(1);
  }
}

seedDB();