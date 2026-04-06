import { Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BookOpen, MapPin, Clock, Users, Shield, Check, X, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from '../../components/teacher/TeacherSidebar';

import ManualAttendance from './ManualAttendance';
import NotificationDropdown from '../../components/shared/NotificationDropdown';
import ThemeToggle from '../../components/shared/ThemeToggle';
import TimetableGrid from '../../components/shared/TimetableGrid';
import ClassRoster from './ClassRoster';

const TeacherTimetable = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const { data } = await axios.get('/teacher/subjects');
                setSubjects(data);
            } catch (error) {
                console.error("Failed to fetch teacher subjects", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your schedule...</div>;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Dashboard Header & Animated Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Teacher Schedule</h2>
                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(236, 72, 153, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: 'relative',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, var(--brand-primary), #ec4899)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    <motion.div
                        animate={{ x: ['-200%', '300%'] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '40%',
                            height: '100%',
                            background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent)',
                            transform: 'skewX(-20deg)',
                            zIndex: 1
                        }}
                    />
                    <Clock size={18} style={{ zIndex: 2, position: 'relative' }} />
                    <span style={{ zIndex: 2, position: 'relative' }}>Generate Report</span>
                </motion.button>
            </div>

            {subjects.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't been assigned any subjects yet.</p>
                </div>
            ) : (
                <TimetableGrid subjects={subjects} hideTeacher={true} />
            )}
        </div>
    );
};

const LeaveApprovals = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchLeaves = async () => {
        try {
            const { data } = await axios.get('/leave/coordinator/all');
            setLeaves(data);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleAction = async (id, action, reason = '') => {
        setActionLoading(id);
        try {
            console.log(`Action: ${action} on ID: ${id}`);
            await axios.put(`/leave/${action}/${id}`, { reason });
            await fetchLeaves();
            console.log(`[SUCCESS] Action ${action} completed for ${id}`);
        } catch (error) {
            console.error(`[ERROR] Action ${action} failed for ${id}:`, error);
            alert(error.response?.data?.message || `Failed to ${action} leave`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="glass-panel" style={{ padding: '2rem' }}>Loading leave requests...</div>;

    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Leave Approvals</h2>
                <span className="badge badge-primary">{leaves.length} Total Requests</span>
            </div>

            {leaves.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                    <p>No leave requests found for your coordination scope.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {leaves.map((leave) => (
                        <div key={leave._id} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{leave.userId?.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Roll: {leave.userId?.rollNumber}</p>
                                </div>
                                <div className={`badge badge-${(new Date() > new Date(leave.endDate) && leave.status === 'approved') ? 'secondary' : leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'warning' : 'danger'}`}>
                                    {(new Date() > new Date(leave.endDate) && leave.status === 'approved') ? 'LEAVE ENDED' : leave.status.toUpperCase()}
                                </div>
                            </div>

                            <div style={{ margin: '1rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Duration</label>
                                    <p>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Reason</label>
                                    <p>{leave.reason}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                {leave.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(leave._id, 'approve')}
                                            disabled={actionLoading === leave._id}
                                            className="btn btn-primary"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(leave._id, 'reject')}
                                            disabled={actionLoading === leave._id}
                                            className="btn btn-outline"
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {leave.status === 'approved' && (
                                    <button
                                        onClick={() => {
                                            const reason = prompt("Enter revocation reason:");
                                            if (reason) handleAction(leave._id, 'revoke', reason);
                                        }}
                                        disabled={actionLoading === leave._id}
                                        className="btn btn-outline"
                                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    >
                                        Revoke Leave
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TeacherDashboard = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
        <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
            <TeacherSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="dashboard-main">

                <header className="glass-panel dashboard-header">
                    <div className="flex-row-mobile">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={24} />
                            </button>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Educator Overview</h1>
                        </div>
                    </div>
                    <div className="dashboard-header-actions">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="group">
                            <div style={{
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(79, 70, 229, 0.1)',
                                color: 'var(--brand-primary)',
                                cursor: 'help',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                                    <Shield size={18} />
                                </motion.div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>System Status</span>
                            </div>

                            {/* Floating Permissions Info */}
                            <div className="permissions-tooltip" style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.5rem',
                                width: '260px',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '1rem',
                                boxShadow: 'var(--shadow-xl)',
                                padding: '1rem',
                                zIndex: 1000,
                                visibility: 'hidden',
                                opacity: 0,
                                transition: 'all 0.2s'
                            }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Your Active Permissions</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {[
                                        { id: 'viewAttendance', label: 'View Reports & Roster' },
                                        { id: 'markAttendance', label: 'Standard Marking' },
                                        { id: 'manualAttendance', label: 'Manual Attendance Override' },
                                        { id: 'editAttendance', label: 'Edit Existing Records' },
                                        { id: 'deleteAttendance', label: 'Delete Records' },
                                        { id: 'exportAttendance', label: 'Export Documents' },
                                        { id: 'bypassTimeRestraint', label: 'Anytime Attendance Override', special: true }
                                    ].map(p => {
                                        const has = user?.permissions?.includes(p.id);
                                        return (
                                            <div key={p.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.75rem',
                                                color: has ? 'var(--text-primary)' : 'var(--text-light)',
                                                opacity: has ? 1 : 0.5
                                            }}>
                                                {has ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                                                <span style={{ fontWeight: has ? '700' : '400' }}>{p.label}</span>
                                                {p.special && has && <span style={{ padding: '0.1rem 0.3rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '4px', fontSize: '0.6rem' }}>Unlimited</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                                <style>{`.group:hover .permissions-tooltip { visibility: visible !important; opacity: 1 !important; transform: translateY(5px); }`}</style>
                            </div>
                        </div>
                        <ThemeToggle />
                        <NotificationDropdown />
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                            {user?.name?.charAt(0) || 'T'}
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100vw' }}>
                    <Routes>
                        <Route path="/" element={<TeacherTimetable />} />

                        <Route path="/manual" element={<ManualAttendance />} />
                        <Route path="/leaves" element={<LeaveApprovals />} />
                        <Route path="/roster" element={<ClassRoster />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
