# clinicflow-frontend

## Overview

**ClinicFlow Frontend** is the web user interface for **ClinicFlow**, a doctor-focused clinical management system designed for real-world medical practice.

The frontend allows a single doctor to securely manage:

- Patients
- Consultations
- Prescriptions
- Appointments (agenda)
- Medical documents (PDF prescriptions)

The frontend consumes a secure REST API provided by the ClinicFlow backend.

---

## Architecture

ClinicFlow follows a **separation of concerns** architecture:

- **Backend**: Django + Django REST Framework (API)
- **Frontend**: React + Vite (Web UI)

### Backend Repository

👉 **clinicflow-backend**  
https://github.com/ClinicFlow2/backend

---

## Key Features

- Secure JWT-based authentication
- Patient management interface
- Consultation workflow with vital signs
- Prescription creation using reusable templates
- PDF preview and download for prescriptions
- Appointment scheduling (agenda)
- Bilingual interface (English 🇬🇧 / French 🇫🇷)
- API-driven architecture (ready for web and mobile clients)

---

## Tech Stack

- **JavaScript**
- **React**
- **Vite**
- **Axios**
- **REST API integration**
- **JWT Authentication**
- **Internationalization (i18n)**

---

## Project Structure

```text
clinicflow-frontend/
├── public/
│   └── vite.svg
│
├── src/
│   ├── api/                    # API communication (Axios)
│   │   ├── auth.js
│   │   ├── client.js
│   │   └── patients.js
│   │
│   ├── pages/                  # Application screens/pages
│   │   ├── Login.jsx
│   │   └── Patients.jsx
│   │
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
