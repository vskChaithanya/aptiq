# AptIQ 🚀

AptIQ is a comprehensive, full-stack MERN application designed to facilitate secure, topic-based aptitude assessments and technical coding rounds. Built to streamline the evaluation process for both students and faculty, it features real-time Python code execution in the browser, live proctoring, and automated test-case evaluation.

## ✨ Key Features

*   **Role-Based Access Control:** Distinct portals for 'Students' and 'Faculty' with restricted data access.
*   **Secure Authentication:** JWT-based sessions, bcrypt password hashing, and email-based OTP verification for registration and password resets.
*   **Interactive Assessments:** 
    *   Multiple Choice Questions (MCQs) mapped to specific aptitude topics.
    *   Integrated Code Editor using `@monaco-editor/react`.
*   **In-Browser Python Execution:** Utilizes Pyodide to run and evaluate Python code securely within the client's browser, eliminating backend server load.
*   **Smart Auto-Evaluation:** Automatically tests submitted code against dynamic test cases and assigns weighted scores.
*   **Live Proctoring:** Integrates webcam access during technical rounds to ensure assessment integrity.
*   **Faculty Dashboard:** Allows instructors to create assignments, bundle questions into Tasks, and manage student records.

## 🛠️ Tech Stack

**Frontend**
*   React.js (Vite)
*   @monaco-editor/react (IDE interface)
*   Pyodide (WASM Python execution)
*   React Router DOM

**Backend**
*   Node.js & Express.js
*   MongoDB Atlas & Mongoose (Database)
*   JSON Web Tokens (JWT) & Bcrypt (Security)
*   Brevo API (Transactional Emails/OTP)

**Deployment**
*   Hosted on [Render](https://render.com/)

## 📂 Project Structure

\`\`\`text
AptIQ/
├── backend/
│   ├── models/           # Mongoose schemas (User, Question, Task, etc.)
│   ├── server.js         # Express app entry point & API routes
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/   # React components (AssessmentRoom, Dashboards, etc.)
    │   ├── App.jsx       # Main application routing
    │   └── main.jsx
    ├── vite.config.js
    └── package.json
\`\`\`

## 🚀 Local Setup & Installation

### Prerequisites
*   Node.js installed
*   MongoDB Atlas account/connection URI
*   Brevo account for SMTP API keys

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/your-username/AptIQ.git
cd AptIQ
\`\`\`

### 2. Backend Setup
\`\`\`bash
cd backend
npm install
\`\`\`
Create a `.env` file in the `backend` directory:
\`\`\`env
PORT=3000
MONGO_URI=your_mongodb_connection_string
BREVO_API_KEY=your_brevo_api_key
\`\`\`
Start the backend server:
\`\`\`bash
npm start
\`\`\`

### 3. Frontend Setup
\`\`\`bash
cd ../frontend
npm install
\`\`\`
Create a `.env` file in the `frontend` directory:
\`\`\`env
VITE_API_URL=http://localhost:3000
\`\`\`
Start the Vite development server:
\`\`\`bash
npm run dev
\`\`\`

## 🌐 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register/send-otp` | Initiates email verification for new users |
| `POST` | `/api/login` | Authenticates user and returns JWT |
| `GET` | `/api/questions` | Fetches MCQs based on topic and difficulty level |
| `GET` | `/api/coding-questions` | Fetches available Python challenges |
| `POST` | `/api/save-score` | Records student performance to their profile |
| `GET` | `/api/tasks` | Retrieves active faculty-assigned assessments |

## 👨‍💻 Author

**Saikrishna Chaitanya**
*   Computer Science Undergraduate @ SRU '27
*   [LinkedIn](your-linkedin-url) | [GitHub](your-github-url)
