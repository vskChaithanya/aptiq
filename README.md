# 🎓 AptIQ - University Placement Portal

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Project-3b82f6?style=for-the-badge)](https://aptiqforu.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-43853D?style=for-the-badge&logo=node.js&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)]()

> **A secure, dual-role full-stack application designed to streamline aptitude testing, coding assessments, and task management for university students and faculty.**

---

## 📖 Project Overview
AptIQ bridges the gap between students and faculty by providing a centralized platform for skill assessment. Built specifically for the university ecosystem, it ensures secure access through domain-restricted email verification (`@sru.edu.in`) and provides dynamic dashboards tailored to the user's role. 

Whether a faculty member is assigning complex Python tasks or a student is tracking their historical test scores, AptIQ handles the logic seamlessly in real-time.

---

## ✨ Key Features

### 👨‍🎓 For Students
* **Secure Onboarding:** Real-time email verification using the Brevo API (restricted to university domains).
* **Interactive Testing:** Take timed multiple-choice aptitude tests and Python coding challenges.
* **Performance Tracking:** Dedicated dashboard to view historical scores, recent tests, and highest achievements.

### 👨‍🏫 For Faculty
* **Task Management:** Create and assign customized question sets and coding challenges to the student body.
* **Student Analytics:** View registered students and monitor platform engagement.
* **Admin Security:** Restricted login access to ensure only authorized personnel can manage tasks.

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    A[User Visits AptIQ] --> B{Select Role}
    
    %% Student Flow
    B -->|Student| C[Student Portal]
    C --> D{Is Registered?}
    D -->|No| E[Enter @sru.edu.in Email]
    E --> F[Brevo API sends Secure OTP]
    F --> G[Verify OTP & Save to MongoDB]
    G --> H[Student Dashboard]
    D -->|Yes| H
    H --> I[Take Aptitude/Coding Tests]
    I --> J[Save Scores to Profile]
    
    %% Faculty Flow
    B -->|Faculty| K[Faculty Portal]
    K --> L{Authorized Email?}
    L -->|Yes| M[Faculty Dashboard]
    L -->|No| N[Access Denied]
    M --> O[Assign Tasks & Quizzes]
    M --> P[Manage Student Roster]
