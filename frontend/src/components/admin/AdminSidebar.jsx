import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Users, BookOpen, UserPlus, Settings, Activity, GraduationCap } from 'lucide-react';

const AdminSidebar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
        { name: 'Departments & Classes', path: '/admin/academic', icon: <BookOpen size={20} /> },
        { name: 'Manage Subjects', path: '/admin/subjects', icon: <GraduationCap size={20} /> },
        { name: 'Manage Users', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Assignments', path: '/admin/assignments', icon: <UserPlus size={20} /> },
        { name: 'Permissions', path: '/admin/permissions', icon: <Settings size={20} /> },
        { name: 'System Activity', path: '/admin/activity', icon: <Activity size={20} /> },
    ];

    return (
        <div className="glass-panel" style={{ width: '260px', height: 'calc(100vh - 2rem)', margin: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, position: 'sticky', top: '1rem' }}>
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
                    Admin Portal
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{user?.name}</p>
            </div>

            <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map((link) => {
                    const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                background: isActive ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' : 'transparent',
                                fontWeight: isActive ? '500' : '400',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {link.icon}
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={logout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                        border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                        cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s ease'
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
