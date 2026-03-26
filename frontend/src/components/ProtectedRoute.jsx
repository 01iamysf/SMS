import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading, token } = useAuth();

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
