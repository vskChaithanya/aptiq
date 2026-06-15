import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto'; // Imports the Chart.js library we just installed
import '../App.css';

function StudentDashboard() {
  // --- 1. STATE MANAGEMENT ---
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');

  // Refs for the Chart canvases
  const practiceChartRef = useRef(null);
  const taskChartRef = useRef(null);

  // --- 2. INITIAL LOAD (Runs once when dashboard opens) ---
  useEffect(() => {
    // 1. Check for logged in user
    const savedUser = JSON.parse(localStorage.getItem('aptiq_user'));
    if (!savedUser) {
      window.location.href = '/'; // Send to login if not authenticated
      return;
    }
    setUser(savedUser);

    // 2. Fetch Tasks from Backend
    const fetchTasks = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/tasks'); // Point to Node backend
        if (!res.ok) throw new Error("Backend failed to load tasks.");
        const data = await res.json();
        setTasks(data);
        setLoadingTasks(false);
      } catch (err) {
        console.error(err);
        setTaskError(true);
        setLoadingTasks(false);
      }
    };
    fetchTasks();
  }, []);

  // --- 3. CHART RENDERING ---
  useEffect(() => {
    if (!user) return; // Wait until user is loaded

    const history = user.testHistory || [];
    const practiceHistory = history.filter(t => !t.topic.startsWith('TASK:'));
    const taskHistory = history.filter(t => t.topic.startsWith('TASK:'));

    // --- Practice Chart ---
    const pLabels = practiceHistory.length ? practiceHistory.map((_, i) => `Prac ${i + 1}`) : ["Prac 1", "Prac 2"];
    const pData = practiceHistory.length ? practiceHistory.map(t => t.score) : [0, 0];

    const pChartInstance = new Chart(practiceChartRef.current, {
      type: 'line',
      data: {
        labels: pLabels,
        datasets: [{ label: 'MCQ Score', data: pData, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, fill: true, tension: 0.3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 15 } } }
    });

    // --- Task Chart ---
    const tLabels = taskHistory.length ? taskHistory.map((_, i) => `Task ${i + 1}`) : ["Task 1", "Task 2"];
    const tData = taskHistory.length ? taskHistory.map(t => (t.score || 0) + (t.codingScore || 0)) : [0, 0];

    const tChartInstance = new Chart(taskChartRef.current, {
      type: 'bar',
      data: {
        labels: tLabels,
        datasets: [{ label: 'Total Marks (MCQ+Code)', data: tData, backgroundColor: '#8b5cf6', borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // Cleanup function: Destroys old charts so they don't overlap when React re-renders
    return () => {
      pChartInstance.destroy();
      tChartInstance.destroy();
    };
  }, [user]);

  // --- 4. ACTION FUNCTIONS ---
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const openLevelModal = (topic) => {
    setSelectedTopic(topic);
    setIsModalOpen(true);
  };

  const startPractice = (level) => {
    localStorage.setItem('aptiq_current_topic', selectedTopic);
    localStorage.setItem('aptiq_current_level', level);
    localStorage.setItem('aptiq_task_mode', 'false');
    window.location.href = '/test'; // Route to your future test component
  };

  const startTask = (taskId, taskTitle) => {
    localStorage.setItem('aptiq_task_mode', 'true');
    localStorage.setItem('aptiq_task_id', taskId);
    localStorage.setItem('aptiq_task_title', taskTitle);
    window.location.href = '/test'; // Route to your future test component
  };

  // If user data hasn't loaded yet, show a blank screen to prevent errors
  if (!user) return null;

  const completedTasks = (user.testHistory || []).map(t => t.topic);

  // --- 5. THE UI (JSX) ---
  return (
    <>
      <div className="dashboard-container">
        {/* HEADER */}
        <div className="header">
          <h2>Welcome back, {user.name ? user.name.split(' ')[0] : 'Student'}!</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn-profile" onClick={() => window.location.href='/profile'}>👤 Profile</button>
            <button className="btn-logout" onClick={handleLogout}>Log Out</button>
          </div>
        </div>

        {/* STATS ROW */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h4>Highest Practice Score</h4>
              <h3>{user.highestScore || 0} / 15</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-info">
              <h4>Recent Activity</h4>
              <h3>{user.recentTest || "None"}</h3>
            </div>
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a' }}>🌱 Topic Practice History (out of 15)</h3>
            <div className="chart-wrapper">
              <canvas ref={practiceChartRef}></canvas>
            </div>
          </div>
          <div className="chart-card">
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a' }}>💼 Placement Task History (out of 100)</h3>
            <div className="chart-wrapper">
              <canvas ref={taskChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* FACULTY ASSIGNED TASKS */}
        <h3 className="section-title">📋 Faculty Assigned Tasks</h3>
        <div id="tasksContainer" style={{ display: loadingTasks || taskError || tasks.length === 0 ? 'block' : 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          
          {loadingTasks && (
            <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', textAlign: 'center', border: '2px dashed #cbd5e1', color: '#64748b', fontSize: '16px' }}>
              Checking for assigned tasks...
            </div>
          )}

          {taskError && (
            <div style={{ padding: '20px', background: '#fef2f2', borderRadius: '12px', textAlign: 'center', border: '2px dashed #ef4444', color: '#dc2626', fontWeight: 'bold' }}>
              🚨 Server Offline: Please restart your terminal with 'node server.js'
            </div>
          )}

          {!loadingTasks && !taskError && tasks.length === 0 && (
            <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', textAlign: 'center', border: '2px dashed #cbd5e1', color: '#64748b', fontSize: '16px' }}>
              No tasks assigned yet.
            </div>
          )}

          {/* Map through tasks to render cards dynamically */}
          {!loadingTasks && !taskError && tasks.map(task => {
            const isCompleted = completedTasks.includes(`TASK: ${task.title}`);
            const codeCount = task.codingQuestions ? task.codingQuestions.length : 0;

            return (
              <div key={task._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '25px', background: 'white', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: `5px solid ${isCompleted ? '#cbd5e1' : '#8b5cf6'}` }}>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', color: isCompleted ? '#94a3b8' : '#0f172a' }}>{task.title}</h4>
                  <div style={{ fontSize: '14px', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', lineHeight: '1.6' }}>
                    <b>📝 40 MCQs</b><br />
                    <b>💻 {codeCount} Python Tasks</b>
                  </div>
                </div>
                {isCompleted ? (
                  <button disabled style={{ background: '#e2e8f0', color: '#94a3b8', padding: '12px', width: '100%', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'not-allowed', fontSize: '15px' }}>
                    Completed ✅
                  </button>
                ) : (
                  <button onClick={() => startTask(task._id, task.title)} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '12px', width: '100%', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', fontSize: '15px' }}>
                    Start Task
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* TOPIC GRID */}
        <h3 className="section-title">Topic-Wise Practice</h3>
        <div className="topics-grid">
          <div className="topic-card" onClick={() => openLevelModal('division')}>
            <div className="topic-icon">➗</div>
            <div className="topic-title">Division & Divisibility</div>
          </div>
          <div className="topic-card" onClick={() => openLevelModal('lcm')}>
            <div className="topic-icon">🔢</div>
            <div className="topic-title">LCM and HCF</div>
          </div>
          <div className="topic-card" onClick={() => openLevelModal('factors')}>
            <div className="topic-icon">✖️</div>
            <div className="topic-title">Factors & Zeros</div>
          </div>
          <div className="topic-card" onClick={() => openLevelModal('lastdigit')}>
            <div className="topic-icon">#️⃣</div>
            <div className="topic-title">Finding Last Digit</div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <h3 style={{ marginTop: 0 }}>Select Difficulty</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Choose a level to start the practice test.</p>
            <button className="level-btn" onClick={() => startPractice('Easy')}>🌱 Easy</button>
            <button className="level-btn" onClick={() => startPractice('Medium')}>🔥 Medium</button>
            <button className="level-btn" onClick={() => startPractice('Hard')}>💀 Hard</button>
            <button className="level-btn" onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', marginTop: '15px' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentDashboard;