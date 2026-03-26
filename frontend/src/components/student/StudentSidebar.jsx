import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, ClipboardList, Flame, CalendarOff, BookOpen } from 'lucide-react';

const StudentSidebar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const links = [
        { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={20} /> },
        { name: 'My Subjects', path: '/student/subjects', icon: <BookOpen size={20} /> },
        ...(user?.permissions?.includes('viewAttendance') ? [
            { name: 'Attendance History', path: '/student/history', icon: <ClipboardList size={20} /> }
        ] : []),
        { name: 'My Streaks', path: '/student/streaks', icon: <Flame size={20} /> },
        { name: 'Leave Application', path: '/student/leaves', icon: <CalendarOff size={20} /> },
    ];

    return (
        <div className="glass-panel" style={{ width: '260px', height: 'calc(100vh - 2rem)', margin: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>S</div>
                    Student Hub
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{user?.name}</p>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--warning)', display: 'block', marginTop: '0.25rem' }}>🔥 Streak: {user?.streakCount || 0}</span>
            </div>

            <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
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

export default StudentSidebar;
