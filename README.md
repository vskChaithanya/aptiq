=============================================================================
   ___         __  ________ 
  / _ | ___   / /_/  _/ __ \
 / __ |/ _ \ / __// // /_/ /
/_/ |_/ .__/ \__/___/\___\_\
     /_/                    

=============================================================================
> PROJECT     : AptIQ 
> VERSION     : 1.0.0
> STACK       : MERN (MongoDB, Express, React, Node.js)
> ENVIRONMENT : Web / WebAssembly
=============================================================================

[![Visit AptIQ Website](https://img.shields.io/badge/🚀_Visit_AptIQ_Live-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://aptiq-c4lg.onrender.com)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

---

### [ 01. OVERVIEW ]
AptIQ is a secure, full-stack aptitude and coding assessment platform. It brings the power of a technical interview environment directly to the browser. By combining standard MCQ logic with a secure, WebAssembly-powered Python execution engine, it allows institutions to test, monitor, and auto-evaluate students in real time.

---

### [ 02. SYSTEM FEATURES ]
* [x] **CLIENT-SIDE EXECUTION** : Runs Python scripts natively in the browser via Pyodide.
* [x] **LIVE PROCTORING** : Automated webcam streaming during technical rounds.
* [x] **SMART EVALUATION** : Dynamic test-case generation and automated scoring.
* [x] **ROLE-BASED PORTALS** : Isolated Student and Faculty dashboards.
* [x] **SECURE AUTHENTICATION** : JWT sessions + Brevo OTP email verification.
* [x] **INTEGRATED IDE** : Monaco Editor implementation for a VS Code-like experience.

---

### [ 03. ARCHITECTURE DIRECTORY ]
    AptIQ_Root/
     │
     ├── /backend               [ REST API & Database Models ]
     │   ├── /models            - Mongoose schemas (User, Task, Questions)
     │   ├── server.js          - Express routing & authentication logic
     │   └── .env               - Environment secrets (Local)
     │
     └── /frontend              [ React UI & Client Logic ]
         ├── /src               
         │   ├── /components    - Modular UI (AssessmentRoom, Dashboards)
         │   ├── App.jsx        - Route controller
         │   └── main.jsx       - Application entry
         ├── vite.config.js     - Bundler configuration
         └── package.json       - Client dependencies

---

### [ 04. INITIALIZATION SEQUENCE ]

**[ Prerequisites ]**
> Node.js (v18+)
> MongoDB Atlas Cluster
> Brevo API Key

**[ Backend Boot Sequence ]**
    $ cd backend
    $ npm install
    $ echo "PORT=3000" >> .env
    $ echo "MONGO_URI=your_cluster_url" >> .env
    $ echo "BREVO_API_KEY=your_brevo_key" >> .env
    $ npm start

**[ Frontend Boot Sequence ]**
    $ cd frontend
    $ npm install
    $ echo "VITE_API_URL=https://aptiqforu.onrender.com" >> .env
    $ npm run dev

---

### [ 05. API ENDPOINTS ]

| METHOD | ROUTE                      | PROCESS                             |
| :----- | :------------------------- | :---------------------------------- |
| POST   | `/api/register/send-otp`   | Dispatches 2FA code to email        |
| POST   | `/api/login`               | Issues JWT auth token               |
| GET    | `/api/questions`           | Retrieves MCQ data payload          |
| POST   | `/api/save-score`          | Commits user score to database      |
| GET    | `/api/tasks`               | Fetches faculty-assigned modules    |

---

### [ 06. SYS_ADMIN ]
**Developed & Maintained by:**
> **Saikrishna Chaitanya**
> Undergrad @ SRU '27
> 🔗 [LinkedIn](https://www.linkedin.com/in/sai-krishnachaithanya/)
> 🐙 [GitHub](https://github.com/vskChaithanya)

=============================================================================
> EOF
=============================================================================
