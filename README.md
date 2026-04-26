# 🏫 iAttend

A modern, full-stack Student Attendance Management System designed for attendance tracking, leave management, and academic organization — featuring a premium dark theme, responsive mobile-first UI, multi-role dashboards, and robust Dockerized security.

### A college project.......

---

## 🚀 Key Features

- **Multi-Role Authentication** — Admin, Teacher, Student, and Parent accounts
- **Attendance Management** — Manual marking with automated email notifications
- **Leave System** — Apply, approve, and track leaves with automatic attendance adjustment and medical document uploads
- **Academic Setup** — Manage departments, classes, subjects, and teacher allocations
- **Parent Dashboard** — Track performance and attendance for multiple children
- **Interactive Reports** — Visual analytics and history logs
- **Dark / Light Theme** — Toggle between premium dark and clean light modes
- **Production-Ready Security** — Hardened Docker containers, MongoDB authentication, and strict CORS policies.

---

## 📁 Project Structure

```text
.
├── backend/                 # Node.js + Express API
│   ├── controllers/         # Business logic for all routes
│   ├── models/              # Mongoose schemas (User, Attendance, etc.)
│   ├── routes/              # API entry points
│   └── seedAdmin.js         # Script to initialize the first admin user
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── pages/           # Page components (Role-specific dashboards)
│   │   └── components/      # Reusable UI components
│
├── docker-compose.yml       # Orchestrates MongoDB, Backend, and Frontend
└── README.md
```

---

## 🛠️ Quick Start Guide (Using Docker)

The easiest and most secure way to run this project is using Docker Compose. This will automatically spin up the database, the backend API, and the frontend React app all connected together securely.

### Prerequisites (Windows, macOS, & Linux)

The beauty of Docker is that this project runs exactly the same on **Windows, macOS, and Linux**. 
Make sure you have the following installed for your specific operating system:

- **Windows:** Download and install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/). Make sure WSL 2 is enabled during installation.
- **macOS:** Download and install [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/) (Choose the Apple Silicon or Intel chip version based on your Mac).
- **Linux:** Install the Docker Engine and Docker Compose using your package manager.

*(Note: Docker Compose is automatically included with Docker Desktop on Windows and Mac).*

### Step 1 — Clone the Repository

```bash
git clone https://github.com/01iamysf/SMS.git
cd SMS
```

### Step 2 — Set Up Environment Variables

Your backend requires configuration variables (like the database password and email settings) to run.
We have provided a template for you.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Copy the example file to create your actual `.env` file:
   - **Mac/Linux/Git Bash:** `cp .env.example .env`
   - **Windows Command Prompt:** `copy .env.example .env`
3. Open `.env` in a text editor and fill in any required passwords (especially your Gmail App Password if you want email notifications to work). Keep the `MONGO_URI` exactly as it is in the template for Docker.

### Step 3 — Build and Start the Containers

Return to the root directory (where `docker-compose.yml` is located) and start everything up:

```bash
cd ..
docker-compose up -d --build
```
*Note: The first time you run this, it will take a few minutes to download the node images and install dependencies.*

### Step 4 — Initialize the Admin User

Because the database is completely empty on a fresh install, you need to create your first Administrator account to be able to log in. Run the included seed script inside the running backend container:

```bash
docker exec backend node seedAdmin.js
```

This will securely create your default admin user:
- **Email:** `admin@example.com`
- **Password:** `admin123`

### Step 5 — Open the App!

Open your web browser and navigate to:
**http://localhost:5173**

You can now log in using the admin credentials generated in Step 4.

---

## 🔧 Shutting Down & Cleaning Up

To stop the servers, run:
```bash
docker-compose down
```

**⚠️ Important Note for Developers:** 
If you want to completely wipe your local database and start completely fresh, use the `-v` flag:
```bash
docker-compose down -v
```
*(If you do this, you will need to run the `seedAdmin.js` script again the next time you start the app, because your admin user will be deleted).*

---

## 🛡️ Security Features Included

- **MongoDB Authentication:** The database requires credentials and does not expose its port to the public internet.
- **Root-less Containers:** The backend container drops root privileges and runs as a restricted `node` user.
- **Strict CORS Policy:** The backend explicitly rejects requests from unauthorized frontend domains.
- **Secure Secret Management:** All `.env` files are strictly ignored by Git to prevent accidental credential leaks.

---

## 📄 License

This project is for educational purposes.
