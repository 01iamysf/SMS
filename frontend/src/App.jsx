import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

import ParentDashboard from './pages/parent/ParentDashboard';

// Placeholder Imports
const Unauthorized = () => <div>Unauthorized Route</div>;

const ThemeEnforcer = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [user]);

  return null;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'admin': return <Navigate to="/admin" />;
    case 'teacher': return <Navigate to="/teacher" />;
    case 'student': return <Navigate to="/student" />;
    case 'parent': return <Navigate to="/parent" />;
    default: return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeEnforcer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={<RootRedirect />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>

          {/* Teacher Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher/*" element={<TeacherDashboard />} />
          </Route>

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/*" element={<StudentDashboard />} />
          </Route>

          {/* Parent Routes */}
          <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
            <Route path="/parent/*" element={<ParentDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
