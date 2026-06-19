<h1 align="center"> AptIQ ⏳</h1>

<h3 align="center">Next-Gen Aptitude & Technical Assessment Platform</h3>

<div align="center">
  <a href="https://aptiq-c4lg.onrender.com">
    <img src="https://img.shields.io/badge/🚀_Click_Here_To_Open_AptIQ_Live-10b981?style=for-the-badge&logo=vercel&logoColor=white" alt="Open AptIQ" />
  </a>
</div>
<br/>

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=webassembly&logoColor=white" />
</div>

---

## 🌟 Overview
Evaluating student performance is often fragmented—institutions use one tool for MCQs and a completely different platform for coding. **AptIQ** is a unified, full-stack MERN application designed to fix this. 

It seamlessly blends quantitative aptitude tests with a **live, secure, in-browser Python IDE**. By leveraging WebAssembly, code executes safely right in the client's browser, meaning zero heavy computing load on the backend server!

## 🚀 Key Features
* 👨‍💻 **In-Browser IDE:** Write, run, and evaluate Python code natively using Pyodide (WebAssembly).
* 🔴 **Live Proctoring:** Automated webcam monitoring during coding rounds to ensure fair testing.
* 🔐 **Secure Access:** Strict email validation (Brevo OTP) and secure JWT sessions.
* 📊 **Smart Grading:** Automatic scoring of student code against custom hidden test cases.
* 🎓 **Role-Based Portals:** Dedicated, feature-rich dashboards for both Students and Faculty.

---

## 🔄 Application Workflow

Here is how data and user interactions flow through the AptIQ platform:

1. **🔒 Authentication & Onboarding**
   * User registers with an `.edu.in` email (Student) or Admin email (Faculty).
   * Brevo API triggers a 6-digit OTP to verify the email identity.
   * Secure JWT session is created upon successful login.
2. **🎛️ Role-Based Routing**
   * **Faculty:** Directed to a dashboard to create assignments, bundle multiple-choice and coding questions, and view student scores.
   * **Students:** Directed to a portal to select topics or take assigned tasks.
3. **📝 Assessment Phase 1: Quantitative (MCQs)**
   * React fetches randomized questions from the MongoDB database based on the selected topic (e.g., Division, LCM).
   * Real-time score tracking is displayed to the user.
4. **💻 Assessment Phase 2: Technical Round**
   * Camera automatically activates for **Live Proctoring**.
   * The Monaco Editor initializes, and Pyodide downloads the Python 3 runtime directly into the browser.
   * Student submits code ➡️ WebAssembly runs the code against hidden test cases ➡️ Output is matched against expected results.
5. **📈 Evaluation & Storage**
   * Final scores (MCQ + Coding) are calculated locally.
   * Results are securely posted to the Express backend and permanently saved to the user's MongoDB profile.

---

## 📂 Project File Structure

AptIQ follows a clean, modular MERN stack architecture separating the client-side UI from the server-side logic.

```text
AptIQ/
│
├── backend/                    
│   ├── models/                
│   │   ├── User.js             
│   │   ├── Question.js        
│   │   ├── CodingQuestion.js 
│   │   └── Task.js            
│   ├── server.js               
│   ├── package.json           
│   └── .env                    
│
├── frontend/                   
│   ├── public/                 
│   ├── src/                     
│   │   ├── components/     
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx     
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── FacultyDashboard.jsx
│   │   │   └── AssessmentRoom.jsx 
│   │   ├── App.jsx             
│   │   ├── App.css             
│   │   └── main.jsx             
│   ├── vite.config.js          
│   ├── package.json            
│   └── .env                  
│
└── README.md                    
