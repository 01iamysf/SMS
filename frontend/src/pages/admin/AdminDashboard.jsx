import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AcademicManage from './AcademicManage';
import SubjectManage from './SubjectManage';
import UserManage from './UserManage';
import Assignments from './Assignments';
import Permissions from './Permissions';
import GlobalSearch from '../../components/shared/GlobalSearch';
import NotificationDropdown from '../../components/shared/NotificationDropdown';
import SystemActivity from './SystemActivity';
import DashboardOverview from './DashboardOverview';
import AdminProfile from './AdminProfile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    return (
        <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
            <AdminSidebar />
            <main style={{ flex: 1, padding: '1rem 2rem 1rem 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <header className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Admin Control Panel</h1>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <GlobalSearch />
                        <NotificationDropdown />
                        <div
                            onClick={() => navigate('/admin/profile')}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--brand-primary), #ec4899)',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                border: '2px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {user?.avatar && (
                                <img
                                    src={user.avatar}
                                    alt="Admin"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                        </div>
                    </div>
                </header>

                {/* Content routing */}
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<DashboardOverview />} />
                        <Route path="/academic" element={<AcademicManage />} />
                        <Route path="/subjects" element={<SubjectManage />} />
                        <Route path="/users" element={<UserManage />} />
                        <Route path="/assignments" element={<Assignments />} />
                        <Route path="/permissions" element={<Permissions />} />
                        <Route path="/activity" element={<SystemActivity />} />
                        <Route path="/profile" element={<AdminProfile />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
