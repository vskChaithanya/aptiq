import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function FacultyDashboard() {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [codingOptions, setCodingOptions] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Form State
  const [taskName, setTaskName] = useState('');
  const [selectedCodingIds, setSelectedCodingIds] = useState([]);
  const [taskMsg, setTaskMsg] = useState({ text: '', isError: false });
  const [taskToDelete, setTaskToDelete] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    // Auth Check
    const savedUser = JSON.parse(localStorage.getItem('aptiq_user'));
    const token = localStorage.getItem('aptiq_token');
    
    if (!token || !savedUser || savedUser.role !== 'faculty') {
      navigate('/'); // Kick non-faculty out
      return;
    }

    fetchCodingOptions();
    fetchActiveTasks();
    fetchStudents();
  }, [navigate]);

  // --- API CALLS: FETCHING DATA ---
  const fetchCodingOptions = async () => {
    try {
      const res = await fetch('https://aptiqforu.onrender.com/api/coding-questions');
      const data = await res.json();
      setCodingOptions(data);
    } catch (err) {
      console.error("Error loading coding questions:", err);
    }
  };

  const fetchActiveTasks = async () => {
    try {
      const res = await fetch('https://aptiqforu.onrender.com/api/tasks');
      const data = await res.json();
      setActiveTasks(data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('https://aptiqforu.onrender.com/api/admin/students');
      if (res.ok) {
        const allUsers = await res.json();
        const studentUsers = allUsers.filter(user => user.role === 'student' || !user.role);
        setStudents(studentUsers);
      }
    } catch (err) {
      console.error("Error loading students:", err);
    }
  };

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCheckboxChange = (id) => {
    setSelectedCodingIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    
    if (selectedCodingIds.length !== 2) {
      setTaskMsg({ text: `❌ You selected ${selectedCodingIds.length}. Please select EXACTLY 2 Python questions.`, isError: true });
      return;
    }

    setTaskMsg({ text: "Packaging task... Please wait.", isError: false });

    try {
      const res = await fetch('https://aptiqforu.onrender.com/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskName, codingIds: selectedCodingIds })
      });
      const data = await res.json();
      
      setTaskMsg({ text: data.message, isError: !res.ok });
      
      if (res.ok) {
        setTaskName('');
        setSelectedCodingIds([]);
        fetchActiveTasks(); // Auto-refresh task table
      }
    } catch (err) {
      setTaskMsg({ text: "Server Offline. Ensure node server.js is running.", isError: true });
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) {
      alert("Please select a task from the dropdown first.");
      return;
    }

    const taskObj = activeTasks.find(t => t._id === taskToDelete);
    const name = taskObj ? taskObj.title : "this task";

    if (window.confirm(`Are you sure you want to delete the task: "${name}"? It will be instantly removed from all student dashboards.`)) {
      try {
        const token = localStorage.getItem('aptiq_token');
        const res = await fetch(`http://localhost:3000/api/admin/tasks/${taskToDelete}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          alert(`Task deleted successfully.`);
          setTaskToDelete('');
          fetchActiveTasks(); // Auto-refresh list
        } else {
          alert("Failed to delete task. You may not have authorization.");
        }
      } catch (err) {
        alert("Server error while trying to delete.");
      }
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm("Delete student permanently from the database?")) {
      try {
        const token = localStorage.getItem('aptiq_token');
        const res = await fetch(`http://localhost:3000/api/admin/students/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchStudents(); // Auto-refresh table
        }
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
  };

  // --- UI RENDER ---
  return (
    <div className="faculty-wrapper">
      {/* HEADER */}
      <header className="faculty-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>👨‍🏫</span>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px' }}>Faculty Control Center</h2>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: '#ef4444', color: 'white' }}>Log Out</button>
      </header>

      {/* CREATE TASK CARD */}
      <div className="faculty-card" style={{ borderLeft: '6px solid #8b5cf6' }}>
        <h3 style={{ marginTop: 0, fontSize: '22px', color: '#0f172a' }}>Assign Placement Task</h3>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '20px' }}>Creates a 40-question MCQ test + 2 selected Python coding challenges.</p>
        
        <form onSubmit={handleAssignTask} className="task-form">
          <input 
            type="text" 
            placeholder="Task Name (e.g., Final Placement Exam)" 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required 
          />
          
          <div style={{ marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '16px' }}>Select exactly 2 Python Questions:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              
              {codingOptions.length === 0 ? (
                <span style={{ color: '#64748b', fontSize: '14px' }}>Loading Python questions... (Did you run node seed.js?)</span>
              ) : (
                codingOptions.map(q => (
                  <label key={q._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: '0.2s', border: '1px solid transparent' }}>
                    <input 
                      type="checkbox" 
                      value={q._id}
                      checked={selectedCodingIds.includes(q._id)}
                      onChange={() => handleCheckboxChange(q._id)}
                      style={{ marginTop: '4px', transform: 'scale(1.2)', width: 'auto' }} 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{q.title}</span>
                      <span style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{q.problemStatement}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <button type="submit" className="btn" style={{ background: '#8b5cf6', color: 'white', padding: '16px', fontSize: '16px', marginTop: '10px' }}>Assign Complete Task</button>
        </form>
        
        {taskMsg.text && (
          <div style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '15px', textAlign: 'center', color: taskMsg.isError ? '#dc2626' : '#10b981' }}>
            {taskMsg.text}
          </div>
        )}
      </div>

      {/* MANAGE TASKS CARD */}
      <div className="faculty-card">
        <h3 style={{ marginTop: 0, fontSize: '22px', color: '#0f172a', marginBottom: '20px' }}>Manage Active Tasks</h3>
        
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select 
            value={taskToDelete}
            onChange={(e) => setTaskToDelete(e.target.value)}
            className="task-form" 
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
          >
            <option value="">-- Select a Task to Delete --</option>
            {activeTasks.map(task => (
              <option key={task._id} value={task._id}>{task.title}</option>
            ))}
          </select>
          <button onClick={handleDeleteTask} className="btn" style={{ background: '#ef4444', color: 'white', padding: '12px 24px' }}>🗑️ Delete Task</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Composition</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeTasks.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '16px' }}>No active tasks assigned.</td></tr>
              ) : (
                activeTasks.map(task => (
                  <tr key={task._id}>
                    <td><strong style={{ fontSize: '16px', color: '#0f172a' }}>{task.title}</strong></td>
                    <td><span style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', color: '#475569', border: '1px solid #e2e8f0' }}>{task.questions?.length || 0} MCQs + {task.codingQuestions?.length || 0} Python Tasks</span></td>
                    <td><span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>🟢 Active</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT ANALYTICS CARD */}
      <div className="faculty-card">
        <h3 style={{ marginTop: 0, fontSize: '22px', color: '#0f172a', marginBottom: '20px' }}>Student Analytics</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="faculty-table">
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Completed Tasks (Marks & Time)</th>
                <th>Practice Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '16px' }}>No students have registered yet.</td></tr>
              ) : (
                students.map(student => {
                  const historyArray = Array.isArray(student.testHistory) ? student.testHistory : [];
                  const taskBadges = historyArray.filter(test => test.topic && test.topic.startsWith('TASK:'));

                  return (
                    <tr key={student._id}>
                      <td>
                        <strong style={{ fontSize: '18px', color: '#0f172a' }}>{student.name}</strong><br />
                        <span style={{ color: '#475569', fontWeight: 'bold', fontSize: '14px', display: 'inline-block', marginTop: '4px' }}>ID: {student.hallTicket}</span><br />
                        <span className="muted">{student.email}</span>
                      </td>
                      <td>
                        {taskBadges.length === 0 ? (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>No tasks completed</span>
                        ) : (
                          taskBadges.map((test, i) => (
                            <div key={i} style={{ background: '#eef2ff', color: '#4f46e5', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #c7d2fe' }}>
                              <strong style={{ fontSize: '15px' }}>📝 {test.topic.replace('TASK: ', '')}</strong><br />
                              <div style={{ fontSize: '13px', color: '#4338ca', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span>⏱️ Time: {test.timeTaken || 'Unknown'}</span>
                                <span>🏆 MCQs: <b>{test.score}/40</b></span>
                                <span>💻 Coding: <b>{test.codingScore || 0}/60</b></span>
                              </div>
                            </div>
                          ))
                        )}
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>
                          {student.highestScore || 0} / 15
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteStudent(student._id)} 
                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;