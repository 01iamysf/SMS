# 🏫 School Management System

A modern, full-stack school management system designed for attendance tracking, leave management, and academic organization — featuring a premium dark theme, responsive mobile-first UI, and multi-role dashboards.

---

## 🚀 Key Features

- **Multi-Role Authentication** — Admin, Teacher, Student, and Parent accounts
- **Attendance Management** — Manual marking with automated email notifications
- **Leave System** — Apply, approve, and track leaves with automatic attendance adjustment
- **Academic Setup** — Manage departments, classes, subjects, and teacher allocations
- **Parent Dashboard** — Track performance and attendance for multiple children
- **Interactive Reports** — Visual analytics and history logs
- **Dark / Light Theme** — Toggle between premium dark and clean light modes
- **Fully Responsive** — Works seamlessly on desktop, tablet, and mobile devices

---

## 📁 Project Structure

```text
.
├── backend/                 # Node.js + Express + MongoDB API
│   ├── controllers/         # Business logic for all routes
│   ├── models/              # Mongoose schemas (User, Attendance, etc.)
│   ├── routes/              # API entry points
│   ├── middleware/          # Auth and error handling
│   └── tools/               # Diagnostic and utility scripts
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── pages/           # Page components (Role-specific dashboards)
│   │   ├── components/      # Reusable UI components
│   │   └── services/        # API integration layers
│
└── README.md
```

---

## 🛠️ Local Development Setup (Step-by-Step)

Follow these steps to clone the project, install all dependencies, and run it locally on your machine.

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9 or higher | Comes with Node.js |
| **MongoDB** | v6+ | See database options below |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/01iamysf/SMS.git
cd SMS
```

---

### Step 2 — Set Up MongoDB

You need a running MongoDB instance. Choose **one** of the following options:

#### Option A: Using Docker (Recommended)

```bash
# Pull and start MongoDB container
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Verify it's running
docker ps
```

> To start it again later: `docker start mongodb`

#### Option B: Local MongoDB Installation

Install MongoDB Community Edition for your OS from [mongodb.com/try/download](https://www.mongodb.com/try/download/community), then start the service:

```bash
# Linux
sudo systemctl start mongod

# macOS (Homebrew)
brew services start mongodb-community
```

#### Option C: MongoDB Atlas (Cloud)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com/)
2. Get your connection string (it will look like `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/attendance_system`)
3. Use this as your `MONGO_URI` in the next step

---

### Step 3 — Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install all dependencies
npm install
```

#### Create the Environment File

Create a file named `.env` inside the `backend/` folder:

```bash
touch .env
```

Add the following variables to it (edit with your own values):

```env
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/attendance_system

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# SMTP Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
FROM_EMAIL=your_gmail@gmail.com
FROM_NAME="School Management System"
```

> **📧 Gmail App Password:**
> Gmail requires an **App Password** instead of your regular password.
> Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) to generate one.
> You need 2-Step Verification enabled on your Google account first.

#### Start the Backend Server

```bash
npm run dev
```

You should see:

```
Server running on port 5000
MongoDB Connected: 127.0.0.1
```

> ✅ Keep this terminal open and running.

---

### Step 4 — Frontend Setup

Open a **new terminal** window/tab:

```bash
# Navigate to the frontend directory
cd frontend

# Install all dependencies
npm install

# Start the development server
npm run dev
```

You should see:

```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

> ✅ Keep this terminal open too.

---

### Step 5 — Open in Browser

Open your browser and go to:

```
http://localhost:5173
```

🎉 **That's it!** The application should be fully running.

---

## 📋 Quick Start Summary

For those who just want the commands:

```bash
# Clone
git clone https://github.com/01iamysf/SMS.git
cd SMS

# Backend
cd backend
npm install
# Create .env file (see above for required variables)
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev

# Open http://localhost:5173 in your browser
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB is not running. Start it with `docker start mongodb` or `sudo systemctl start mongod` |
| `Cannot find module` errors | Run `npm install` again in the affected directory (`backend/` or `frontend/`) |
| Frontend shows blank page | Make sure the backend is running on port 5000 first |
| SMTP email errors | Verify your Gmail App Password is correct and 2FA is enabled |
| `Port 5000 already in use` | Kill the existing process: `kill $(lsof -t -i:5000)` or change `PORT` in `.env` |

---

## 🛡️ Security

- JWT-based authentication
- Granular, permission-based access control
- Role-based route protection on both frontend and backend

---

## 📄 License

This project is for educational purposes.

