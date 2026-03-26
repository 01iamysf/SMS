import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Calendar, PenTool, Users, ShieldCheck } from 'lucide-react';

const TeacherSidebar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    // Dynamically build links based on whether user is a Class Coordinator and has permissions
    const baseLinks = [
        { name: 'Weekly Timetable', path: '/teacher', icon: <Calendar size={20} /> },
        { name: 'Class Roster', path: '/teacher/roster', icon: <Users size={20} /> },
        ...(user?.permissions?.includes('manualAttendance') || user?.permissions?.includes('markAttendance') ? [
            { name: 'Mark Attendance', path: '/teacher/manual', icon: <PenTool size={20} /> }
        ] : []),
    ];

    const coordinatorLinks = user?.classCoordinatorFor ? [
        { name: 'Class Leaves (Coord)', path: '/teacher/leaves', icon: <ShieldCheck size={20} /> },
    ] : [];

    const links = [...baseLinks, ...coordinatorLinks];

    return (
        <div className="glass-panel" style={{ width: '260px', height: 'calc(100vh - 2rem)', margin: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>T</div>
                    Educator Portal
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{user?.name}</p>
                {user?.classCoordinatorFor && <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'var(--accent)', color: 'white', borderRadius: '1rem', marginTop: '0.5rem', display: 'inline-block' }}>Coordinator</span>}
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
                                background: isActive ? 'linear-gradient(135deg, var(--brand-secondary), var(--accent))' : 'transparent',
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

export default TeacherSidebar;
