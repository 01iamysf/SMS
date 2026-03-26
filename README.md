# Spectral Singularity - School Management System

A modern, full-stack school management system designed for attendance tracking, leave management, and academic organization.

## 🚀 Key Features

- **Multi-Role Authentication**: Admin, Teacher, Student, and Parent accounts.
- **Attendance Management**: Manual marking with automated email notifications.
- **Leave System**: Apply, approve, and track leaves with automatic attendance adjustment and "Leave Ended" status.
- **Academic Setup**: Manage departments, classes, subjects, and teacher allocations.
- **Parent Dashboard**: Track performance and attendance for multiple children.
- **Interactive Reports**: Visual analytics and history logs for administrators and teachers.

## 📁 Project Structure

```text
.
├── backend/                # Node.js + Express + MongoDB
│   ├── controllers/        # Business logic for all routes
│   ├── models/             # Mongoose schemas (User, Attendance, etc.)
│   ├── routes/             # API entry points
│   ├── middleware/         # Auth and error handling
│   └── tools/              # Diagnostic and utility scripts
├── frontend/               # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/          # Page components (Role-specific)
│   │   ├── components/     # Reusable UI components
│   │   └── services/       # API integration layers
└── README.md               # Project documentation
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Gmail account (for SMTP notifications)

### Backend Setup

1. `cd backend`
2. `npm install`
3. Create a `.env` file with:
   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   SMTP_EMAIL=your_gmail
   SMTP_PASSWORD=your_app_password
   ```
4. `npm run dev`

### Frontend Setup

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 🛡️ Security

- JWT-based authentication.
- Granular, permission-based access control.
- Role-based route protection on both frontend and backend.

## 📄 Documentation

The codebase is documented using JSDoc for backend controllers and models, and major frontend components. Detailed implementation history can be found in the `brain/` directory (private to development).
