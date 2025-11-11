// app_topics.js — robust quiz loader (mouse + keyboard), highlights correct/wrong only when known
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const topicEl = document.getElementById('topic');
    const levelEl = document.getElementById('level');
    const errArea = document.getElementById('errArea');

    const welcome = document.getElementById('welcome');
    const quiz = document.getElementById('quiz');
    const result = document.getElementById('result');
    const qTitle = document.getElementById('qTitle');
    const qMeta = document.getElementById('qMeta');
    const questionText = document.getElementById('questionText');
    const optionsArea = document.getElementById('optionsArea');
    const progressBar = document.getElementById('progressBar');
    const scoreArea = document.getElementById('scoreArea');
    const nextBtn = document.getElementById('nextBtn');
    const restartBtn = document.getElementById('restartBtn');
    const retryBtn = document.getElementById('retryBtn');
    const resultTitle = document.getElementById('resultTitle');
    const resultMeta = document.getElementById('resultMeta');
    const shareBtn = document.getElementById('shareBtn');

    let questions = [];
    let index = 0;
    let score = 0;
    let answered = false;

    // attach handlers
    startBtn.addEventListener('click', startQuiz);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', resetToStart);
    retryBtn.addEventListener('click', resetToStart);
    shareBtn && shareBtn.addEventListener('click', copyResultToClipboard);

    // keyboard handling
    document.addEventListener('keydown', (e) => {
      if (quiz.style.display === 'none') return;
      if (/^[1-4]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const opts = optionsArea.querySelectorAll('.option');
        if (opts && opts[idx] && !opts[idx].disabled) {
          opts[idx].click();
        }
      } else if (e.key === 'Enter') {
        if (!nextBtn.disabled) nextBtn.click();
      }
    });

    function startQuiz() {
      errArea.textContent = '';
      const key = topicEl.value;
      const levelKey = levelEl.value;

      if (!window.topicBanks || !window.topicBanks[key]) {
        errArea.textContent = 'Topic data not loaded. Ensure bank files are present and error-free.';
        console.error('topicBanks missing or malformed', window.topicBanks);
        return;
      }

      const bank = window.topicBanks[key] && window.topicBanks[key][levelKey];
      if (!Array.isArray(bank) || bank.length === 0) {
        errArea.textContent = 'No questions found for this topic/level.';
        console.warn('bank missing or empty for', key, levelKey, bank);
        return;
      }

      // Validation: banks expected to have 15; warn but allow proceed
      if (bank.length < 15) {
        console.warn(`Bank for ${key} ${levelKey} has ${bank.length} questions (expected 15). Proceeding anyway.`);
      }
      if (bank.length > 15) {
        console.warn(`Bank for ${key} ${levelKey} has ${bank.length} questions; slicing to 15.`);
      }

      // clone and slice to 15
      questions = bank.slice(0, 15).map(q => ({
        question: String(q.question || '').trim(),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        answer: (q.answer || '').toString().trim()
      }));

      // shuffle safely
      questions = questions.sort(() => Math.random() - 0.5);

      welcome.style.display = 'none';
      result.style.display = 'none';
      quiz.style.display = 'block';
      index = 0;
      score = 0;
      answered = false;
      updateScoreLabel();
      renderQuestion();

      const prettyMap = {
        division: 'Division & Divisibility Rules',
        lcm: 'LCM and HCF',
        factors: 'Factors & Trailing Zeros',
        lastdigit: 'Finding Last Digit'
      };
      qMeta.textContent = `${prettyMap[key] || key} • ${levelKey === 'level1' ? 'Level 1' : 'Level 2'}`;
    }

    function renderQuestion() {
      // Reset UI
      nextBtn.disabled = true;
      answered = false;

      const q = questions[index];
      if (!q) {
        console.error('Missing question at index', index);
        questionText.textContent = 'Question not available';
        optionsArea.innerHTML = '';
        return;
      }

      qTitle.textContent = `Question ${index + 1} of ${questions.length}`;
      questionText.textContent = q.question || '---';

      // Build option buttons
      optionsArea.innerHTML = '';
      const opts = q.options && q.options.length ? q.options : [];
      for (let i = 0; i < opts.length; i++) {
        const raw = opts[i] + '';
        const letter = String.fromCharCode(65 + i); // 'A'..'D'
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option';
        // store letter & raw in dataset for safe retrieval
        btn.dataset.letter = letter;
        btn.dataset.raw = raw;

        // badge
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = letter;

        // content
        const content = document.createElement('div');
        content.className = 'content';
        // remove leading "A." or "A)" or "A - " if present
        content.textContent = raw.replace(/^\s*[A-D][\.\)\-:\s]+/i, '').trim();

        btn.appendChild(badge);
        btn.appendChild(content);

        // click handler (use closure to keep correct values)
        btn.addEventListener('click', function () {
          selectAnswer(this, letter, questions[index].answer || '');
        });

        optionsArea.appendChild(btn);
      }

      // If fewer than 2 options, warn
      if (opts.length < 2) {
        console.warn(`Question ${index + 1} has fewer than 2 options.`, q);
      }

      updateProgressBar();
    }

    function selectAnswer(button, userLetter, correctRaw) {
      if (answered) return; // guard
      answered = true;

      const correctLetter = extractLetter(correctRaw); // returns 'A'..'D' or empty
      const hasKnownAnswer = !!correctLetter;

      const all = Array.from(optionsArea.querySelectorAll('.option'));

      // disable buttons and apply classes
      all.forEach((b) => {
        b.disabled = true;
        const bLetter = (b.dataset.letter || '').toUpperCase();
        if (hasKnownAnswer && bLetter === correctLetter) {
          b.classList.add('correct');
        }
      });

      // mark wrong only when we have an official answer and the user's choice differs
      if (hasKnownAnswer) {
        if (userLetter !== correctLetter) {
          button.classList.add('wrong');
        } else {
          // correct — already highlighted above
        }
      } else {
        // no known answer — highlight user selection lightly (optional)
        // do nothing (neutral), but mark as disabled so user sees selection
        button.classList.add('selected'); // style not defined by default; safe no-op
        console.warn(`Question ${index + 1} missing 'answer' in bank. User selection left neutral.`);
      }

      // update score only if known and correct
      if (hasKnownAnswer && userLetter === correctLetter) {
        score++;
        updateScoreLabel();
      }

      nextBtn.disabled = false;
      updateProgressBar();
    }

    // helper: extract A/B/C/D from varied formats: "B", "B.", "Answer: B", "Option B", "B) 12"
    function extractLetter(raw) {
      if (!raw) return '';
      const m = ('' + raw).match(/([A-D])/i);
      if (m) return m[1].toUpperCase();
      return '';
    }

    function updateScoreLabel() {
      scoreArea.textContent = `Correct: ${score}`;
    }

    function updateProgressBar() {
      const pct = questions.length ? Math.round((index / questions.length) * 100) : 0;
      progressBar.style.width = `${pct}%`;
    }

    function nextQuestion() {
      if (!answered) return; // require answering
      if (index < questions.length - 1) {
        index++;
        renderQuestion();
      } else {
        showResult();
      }
    }

    function showResult() {
      quiz.style.display = 'none';
      result.style.display = 'block';
      resultTitle.textContent = 'Quiz Completed 🎉';
      resultMeta.textContent = `You scored ${score} out of ${questions.length}`;
      progressBar.style.width = '100%';
    }

    function resetToStart() {
      questions = [];
      index = 0;
      score = 0;
      answered = false;
      quiz.style.display = 'none';
      result.style.display = 'none';
      welcome.style.display = 'block';
      errArea.textContent = '';
      progressBar.style.width = '0%';
      updateScoreLabel();
    }

    function copyResultToClipboard() {
      const text = `AptIQ result — scored ${score} / ${questions.length}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          shareBtn.textContent = 'Copied!';
          setTimeout(() => (shareBtn.textContent = 'Copy Result'), 1500);
        });
      } else {
        alert(text);
      }
    }

    // expose small debug helper if dev console wanted
    window._aptIQ = {
      inspectBanks: () => window.topicBanks || {}
    };

    // initial state
    resetToStart();
  });
})();