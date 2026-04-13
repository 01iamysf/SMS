import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LineChart, FileText, ShieldCheck, BookOpen, X } from 'lucide-react';
import ThemeToggle from '../shared/ThemeToggle';

const ParentSidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const links = [
        { name: 'Summary & Analytics', path: '/parent', icon: <LineChart size={20} /> },
        { name: 'Detailed History', path: '/parent/history', icon: <FileText size={20} /> },
        { name: 'Leave Applications', path: '/parent/leaves', icon: <ShieldCheck size={20} /> },
        { name: 'Academic Details', path: '/parent/academic', icon: <BookOpen size={20} /> },
    ];

    return (
        <>
            <div className={`mobile-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}></div>
            <div className={`glass-panel sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--brand-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>P</div>
                            Parent Portal
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{user?.name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <ThemeToggle />
                        <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

            <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
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
        </>
    );
};

export default ParentSidebar;
