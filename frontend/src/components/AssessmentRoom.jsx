import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import '../App.css';

function AssessmentRoom() {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [testPhase, setTestPhase] = useState('loading'); // loading, mcq, coding, result, error
  const [errorMsg, setErrorMsg] = useState('');
  
  // Data State
  const [questions, setQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [taskTitle, setTaskTitle] = useState('Practice Test');
  const [user, setUser] = useState({});
  const [isTaskMode, setIsTaskMode] = useState(false);
  
  // Progress State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [codingIdx, setCodingIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCodingScore, setTotalCodingScore] = useState(0);
  
  // MCQ specific State
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Coding specific State
  const [code, setCode] = useState("# Read standard input automatically\n# Example: n = int(input())\n\n");
  const [isRunning, setIsRunning] = useState(false);
  
  // Refs
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const videoRef = useRef(null);
  const terminalRef = useRef(null);
  const pyodideInstance = useRef(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('aptiq_user'));
    const token = localStorage.getItem('aptiq_token');
    
    if (!token || !savedUser) {
      navigate('/');
      return;
    }
    setUser(savedUser);

    const taskMode = localStorage.getItem('aptiq_task_mode') === 'true';
    setIsTaskMode(taskMode);
    setTaskTitle(localStorage.getItem('aptiq_task_title') || 'Practice Test');

    const fetchTestData = async () => {
      try {
        let fetchedQs = [];
        let fetchedCodingQs = [];

        if (taskMode) {
          const taskId = localStorage.getItem('aptiq_task_id');
          const res = await fetch(`http://localhost:3000/api/tasks/${taskId}`);
          if(!res.ok) throw new Error("Failed to load task");
          const taskData = await res.json();
          fetchedQs = taskData.questions || [];
          fetchedCodingQs = taskData.codingQuestions || [];
        } else {
          const topic = localStorage.getItem('aptiq_current_topic');
          const level = localStorage.getItem('aptiq_current_level');
          const res = await fetch(`http://localhost:3000/api/questions?topic=${topic}&level=${level}`);
          if(!res.ok) throw new Error("Failed to load questions");
          fetchedQs = await res.json();
          
          if (fetchedQs.length === 0) {
            fetchedQs = Array.from({length: 5}, (_, i) => ({
              question: `Sample Practice Question ${i + 1} for ${topic?.toUpperCase()} (${level})`,
              options: ['A. Demo Option 1', 'B. Demo Option 2', 'C. Demo Option 3', 'D. Demo Option 4'],
              answer: 'A. Demo Option 1'
            }));
          }
        }

        if (fetchedQs.length === 0 && fetchedCodingQs.length === 0) {
          throw new Error("No questions found.");
        }

        // Shuffle MCQ options
        const shuffled = [...fetchedQs].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setCodingQuestions(fetchedCodingQs);
        
        startTimer();
        setTestPhase(shuffled.length > 0 ? 'mcq' : 'coding');

      } catch (err) {
        setErrorMsg(err.message || "Failed to load test data.");
        setTestPhase('error');
      }
    };

    fetchTestData();

    // Cleanup timer and camera on exit
    return () => {
      clearInterval(timerRef.current);
      stopCamera();
    };
  }, [navigate]);

  // --- TIMER & CAMERA LOGIC ---
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitFinalScore(true); // true = forced submission
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or failed.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Trigger camera when entering coding phase
  useEffect(() => {
    if (testPhase === 'coding') {
      startCamera();
    }
  }, [testPhase]);

  // --- MCQ LOGIC ---
  const handleOptionSelect = (opt, correctOpt) => {
    if (selectedOption) return; // Prevent double clicking
    setSelectedOption(opt);
    if (opt === correctOpt) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextMCQ = () => {
    setSelectedOption(null);
    if (currentIdx + 1 >= questions.length) {
      if (codingQuestions.length > 0) {
        setTestPhase('coding');
      } else {
        submitFinalScore(false);
      }
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  };

  // --- PYTHON EXECUTION ENGINE ---
  const runCode = async (isSubmit) => {
    if (!terminalRef.current) return;
    
    if (code.trim() === '') {
      terminalRef.current.innerHTML = `<span style="color: #ef4444;">Error: Editor is empty. Please write some code.</span>`;
      return;
    }

    setIsRunning(true);
    const logArea = terminalRef.current;
    logArea.innerHTML = `<div style="color: #fbbf24; margin-bottom: 15px;">⚙️ Booting Secure Sandbox...</div>`;

    const cq = codingQuestions[codingIdx];
    let cases = [];
    
    // Smart Test Case Generator
    if (cq.testCases && cq.testCases.length >= 6) {
      cases = cq.testCases.slice(0, 6);
    } else {
      const titleText = (cq.title || "").toLowerCase();
      if (titleText.includes("even") || titleText.includes("odd")) {
        cases = [ { input: "4", expected: "Even" }, { input: "7", expected: "Odd" }, { input: "0", expected: "Even" }, { input: "-5", expected: "Odd" } ];
      } else if (titleText.includes("sum")) {
        cases = [ { input: "1 2 3", expected: "6" }, { input: "0 0 0", expected: "0" }, { input: "10 20", expected: "30" } ];
      } else {
        const baseInp = cq.sampleInput || "1";
        const baseOut = cq.sampleOutput ? cq.sampleOutput.trim() : "Output";
        cases = [{ input: baseInp, expected: baseOut }, { input: `${baseInp} (Hidden)`, expected: baseOut }];
      }
    }

    let passedCount = 0;

    try {
      if (!pyodideInstance.current) {
        pyodideInstance.current = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
      }

      for (let i = 0; i < cases.length; i++) {
        let tc = cases[i];
        let placeholderId = `tc-${i}`;
        logArea.innerHTML += `<div id="${placeholderId}" style="margin-bottom: 10px; color: #94a3b8; font-size: 13px;">Running Test Case ${i+1}...</div>`;
        logArea.scrollTop = logArea.scrollHeight;

        const setupCode = `import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = io.StringIO()\nsys.stdin = io.StringIO("""${tc.input}""")`;
        
        await pyodideInstance.current.runPythonAsync(setupCode);
        await pyodideInstance.current.runPythonAsync(code);
        let rawOutput = await pyodideInstance.current.runPythonAsync(`sys.stdout.getvalue()`);
        let actualOutput = rawOutput.trim();

        let isPass = (actualOutput === tc.expected);
        if (isPass) passedCount++;

        const resultNode = document.getElementById(placeholderId);
        if (resultNode) {
          resultNode.innerHTML = `
            <div style="padding: 12px; background: #1e293b; border-radius: 6px; border-left: 4px solid ${isPass ? '#10b981' : '#ef4444'};">
              <strong style="color: ${isPass ? '#10b981' : '#ef4444'}; font-size: 14px;">${isPass ? '✅ Passed' : '❌ Failed'} - Test Case ${i+1}</strong><br>
              <div style="display: grid; grid-template-columns: 80px 1fr; margin-top: 5px; line-height: 1.5;">
                <span style="color: #94a3b8; font-size: 13px;">Input:</span> <span style="color: #f8fafc; font-size: 13px; font-family: monospace;">${tc.input}</span>
                <span style="color: #94a3b8; font-size: 13px;">Expected:</span> <span style="color: #f8fafc; font-size: 13px; font-family: monospace;">${tc.expected}</span>
                <span style="color: #94a3b8; font-size: 13px;">Output:</span> <span style="color: ${isPass ? '#10b981' : '#ef4444'}; font-size: 13px; font-family: monospace;">${actualOutput || "None"}</span>
              </div>
            </div>`;
        }
      }

      const marksEarned = passedCount * 5;
      if (isSubmit) setTotalCodingScore(prev => prev + marksEarned);

      logArea.innerHTML += `
        <div style="margin-top: 20px; padding: 15px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; text-align: center;">
          <strong style="color: ${passedCount === cases.length ? '#10b981' : '#fbbf24'}; font-size: 18px;">
            Result: Passed ${passedCount}/${cases.length} Test Cases.
          </strong><br>
          <span style="color: #8b5cf6; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 5px;">Marks Earned: ${isSubmit ? marksEarned : "0 (Run Mode)"} / 30</span>
        </div>`;
      
      logArea.scrollTop = logArea.scrollHeight;

      if (isSubmit) {
        setTimeout(() => {
          if (codingIdx + 1 >= codingQuestions.length) {
            submitFinalScore(false);
          } else {
            setCode("# Read standard input automatically\n# Example: n = int(input())\n\n");
            setCodingIdx(prev => prev + 1);
            terminalRef.current.innerHTML = "Awaiting execution...";
            setIsRunning(false);
          }
        }, 3000);
      } else {
        setIsRunning(false);
      }

    } catch (err) {
      let errorMessage = err.message;
      if (errorMessage.includes('File "<exec>"')) errorMessage = errorMessage.split('File "<exec>"')[1].trim();
      logArea.innerHTML += `
        <div style="margin-top: 15px;">
          <h3 style="color: #ef4444; margin: 0 0 10px 0;">🚨 Runtime/Syntax Error</h3>
          <pre style="color: #ef4444; background: #1e293b; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; margin: 0; line-height: 1.5;">${errorMessage}</pre>
        </div>`;
      logArea.scrollTop = logArea.scrollHeight;
      setIsRunning(false);
    }
  };

  // --- SUBMISSION LOGIC ---
  const submitFinalScore = async (isForced) => {
    clearInterval(timerRef.current);
    stopCamera();
    setTestPhase('saving');

    const timeTakenSecs = 3600 - timeLeft;
    const timeString = `${Math.floor(timeTakenSecs / 60)}m ${timeTakenSecs % 60}s`;
    const finalTopic = isTaskMode ? `TASK: ${taskTitle}` : taskTitle;

    try {
      const res = await fetch('http://localhost:3000/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: localStorage.getItem('aptiq_token'), 
          score, 
          codingScore: totalCodingScore, 
          topicName: finalTopic, 
          timeTaken: timeString 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, highestScore: data.user.highestScore, recentTest: data.user.recentTest, testHistory: data.user.testHistory };
        localStorage.setItem('aptiq_user', JSON.stringify(updatedUser));
        setTestPhase('result');
      } else {
        throw new Error("Failed to save score");
      }
    } catch (err) {
      setErrorMsg("Failed to save score. Please contact admin.");
      setTestPhase('error');
    }
  };

  // --- RENDERERS ---
  const hallTicket = user.hallTicket || 'STUDENT';
  const watermarkSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="250" height="150"><text x="50%" y="50%" transform="rotate(-30 125 75)" fill="rgba(14,30,60,0.06)" font-size="20" font-weight="bold" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">${hallTicket}</text></svg>`);

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999, backgroundImage: `url('data:image/svg+xml;utf8,${watermarkSvg}')` }}></div>

      <div className="test-card" style={{ maxWidth: testPhase === 'coding' ? '1400px' : '950px' }}>
        
        {/* LOADING PHASE */}
        {testPhase === 'loading' && (
          <div className="overlay-screen">
            <h2 style={{ fontSize: '24px', color: '#0f172a' }}>Initializing Assessment Area...</h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Jumbling questions and preparing secure environment.</p>
          </div>
        )}

        {/* ERROR PHASE */}
        {testPhase === 'error' && (
          <div className="overlay-screen">
            <h2 style={{ color: '#ef4444' }}>{errorMsg}</h2>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px' }}>Return to Dashboard</button>
          </div>
        )}

        {/* SAVING PHASE */}
        {testPhase === 'saving' && (
          <div className="overlay-screen">
            <h2 style={{ color: '#0f172a' }}>Saving your results...</h2>
          </div>
        )}

        {/* RESULT PHASE */}
        {testPhase === 'result' && (
          <div className="overlay-screen">
            <h1 style={{ fontSize: '54px', marginBottom: '10px', marginTop: 0 }}>🎉</h1>
            <h2 style={{ color: '#0f172a', fontSize: '28px', marginTop: 0 }}>Assessment Complete!</h2>
            <p style={{ fontSize: '18px', color: '#475569' }}>You scored <b>{score} / {questions.length}</b> on the MCQs.</p>
            {codingQuestions.length > 0 && (
              <p style={{ color: '#10b981', fontWeight: 'bold', background: '#ecfdf5', display: 'inline-block', padding: '12px 24px', borderRadius: '8px', marginTop: '10px', fontSize: '18px' }}>
                💻 Python Coding Marks: {totalCodingScore} / {codingQuestions.length * 30}
              </p>
            )}
            <br /><br />
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px', fontSize: '18px', padding: '16px 32px' }}>Return to Dashboard</button>
          </div>
        )}

        {/* MCQ PHASE */}
        {testPhase === 'mcq' && questions.length > 0 && (
          <>
            <div className="test-header">
              <div className="q-info">
                <span className="q-number">Question {currentIdx + 1} of {questions.length}</span>
                <span className="q-task">ASSIGNMENT: {taskTitle}</span>
              </div>
              <div className="timer">⏱️ <span>{formatTime(timeLeft)}</span></div>
              <div className="progress-info">
                Correct: {score}
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${(currentIdx / questions.length) * 100}%` }}></div></div>
              </div>
            </div>

            <div className="question-text">{questions[currentIdx].question}</div>
            
            <div className="options-grid">
              {questions[currentIdx].options.map((opt, i) => {
                const isCorrect = opt === questions[currentIdx].answer;
                let btnClass = "option-btn";
                if (selectedOption) {
                  if (opt === questions[currentIdx].answer) btnClass += " correct";
                  else if (opt === selectedOption && !isCorrect) btnClass += " wrong";
                }
                
                return (
                  <button 
                    key={i}
                    className={btnClass} 
                    disabled={selectedOption !== null}
                    onClick={() => handleOptionSelect(opt, questions[currentIdx].answer)}
                  >
                    <div className="opt-letter">{String.fromCharCode(65 + i)}</div>
                    <div>{opt.substring(3)}</div>
                  </button>
                );
              })}
            </div>

            <div className="controls">
              <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Abort Test</button>
              <button className="btn btn-primary" disabled={!selectedOption} onClick={handleNextMCQ}>Next Question</button>
            </div>
          </>
        )}

        {/* CODING PHASE */}
        {testPhase === 'coding' && codingQuestions.length > 0 && (
          <>
            <div className="test-header" style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
              <div className="q-info">
                <span className="q-number" style={{ color: '#0f172a' }}>AptIQ | Technical Round</span>
                <span className="q-task" style={{ color: '#8b5cf6' }}>Python Challenge {codingIdx + 1} of {codingQuestions.length}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="timer">⏱️ <span>{formatTime(timeLeft)}</span></div>
                <div className="proctor-box">
                  <div className="proctor-text">
                    <span>🔴 LIVE PROCTORING</span>
                    <span style={{ fontWeight: 'normal', color: '#7f1d1d' }}>Camera active</span>
                  </div>
                  <video ref={videoRef} className="video-feed" autoPlay muted playsInline></video>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '25px', height: '500px' }}>
              {/* Left Side: Problem Statement */}
              <div style={{ flex: 1, paddingRight: '10px', overflowY: 'auto', textAlign: 'left' }}>
                <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '26px' }}>{codingQuestions[codingIdx].title}</h3>
                <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '16px' }}>{codingQuestions[codingIdx].problemStatement}</p>
                
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                  <strong style={{ color: '#0f172a' }}>Example:</strong><br />
                  <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '14px' }}>
                    <span style={{ color: '#475569' }}>Input:</span> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{codingQuestions[codingIdx].sampleInput || "None"}</span><br />
                    <span style={{ color: '#475569' }}>Output:</span> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{codingQuestions[codingIdx].sampleOutput}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side: IDE & Terminal */}
              <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ background: '#1e293b', padding: '12px 20px', color: '#e2e8f0', fontWeight: 'bold', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
                  <span>main.py</span>
                  <span style={{ color: '#10b981' }}>Python 3.10</span>
                </div>
                
                <div style={{ flex: 1, width: '100%' }}>
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val)}
                    options={{ minimap: { enabled: false }, fontSize: 15 }}
                  />
                </div>
                
                <div className="terminal-scroll" style={{ height: '250px', background: '#0f172a', padding: '15px', overflowY: 'auto', color: '#f8fafc', fontFamily: 'monospace', borderTop: '2px solid #334155', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '10px' }}>Execution Terminal</div>
                  <div ref={terminalRef}>Awaiting execution...</div>
                </div>

                <div className="controls" style={{ padding: '15px 20px', background: 'white', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', marginTop: 0 }}>
                  <button className="btn btn-ghost" disabled={isRunning} onClick={() => runCode(false)} style={{ background: '#f1f5f9', color: '#0f172a' }}>
                    {isRunning ? 'Running...' : 'Run Code'}
                  </button>
                  <button className="btn btn-primary" disabled={isRunning} onClick={() => runCode(true)} style={{ background: '#10b981', color: 'white' }}>
                    {isRunning ? 'Evaluating...' : 'Submit Answer'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}

export default AssessmentRoom;