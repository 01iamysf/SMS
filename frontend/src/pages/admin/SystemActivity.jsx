import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Users, BookOpen, Clock, ChevronRight, User, Search, Filter, Calendar, GraduationCap, ChevronLeft, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';

const SystemActivity = () => {
    // Explorer State
    const [view, setView] = useState('explorer'); // 'explorer' or 'profile'
    const [selection, setSelection] = useState({
        departmentId: '',
        role: 'student',
        classId: '',
        userId: ''
    });

    // Data State
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activityStats, setActivityStats] = useState(null);
    const [userSubjects, setUserSubjects] = useState([]);

    // UX State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (selection.departmentId) {
            fetchClasses(selection.departmentId);
        } else {
            setClasses([]);
            setSelection(prev => ({ ...prev, classId: '' }));
        }
    }, [selection.departmentId]);

    useEffect(() => {
        if (selection.departmentId && (selection.role === 'teacher' || (selection.role === 'student' && selection.classId))) {
            fetchUsers();
        } else {
            setUsers([]);
        }
    }, [selection.departmentId, selection.role, selection.classId]);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get('/admin/departments');
            setDepartments(res.data);
        } catch (err) {
            setError('Failed to fetch departments');
        }
    };

    const fetchClasses = async (deptId) => {
        try {
            const res = await axios.get('/admin/classes');
            const filtered = res.data.filter(c => c.departmentId?._id === deptId || c.departmentId === deptId);
            setClasses(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let res;
            if (selection.role === 'student') {
                res = await axios.get('/admin/students', { params: { classId: selection.classId } });
            } else {
                res = await axios.get('/admin/teachers', { params: { departmentId: selection.departmentId } });
            }
            setUsers(res.data);
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (user) => {
        setLoading(true);
        setError(null);
        setSelectedUser(null);
        setActivityStats(null);
        setView('profile');
        try {
            const res = await axios.get(`/admin/user-details/${user._id}`);
            setSelectedUser(res.data.profile);
            setActivityStats(res.data.stats);
            setUserSubjects(res.data.subjects || res.data.profile.enrolledSubjects || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch activity profile');
            setView('explorer'); // Go back if failed
        } finally {
            setLoading(false);
        }
    };

    const goBackToExplorer = () => {
        setView('explorer');
        setSelectedUser(null);
        setActivityStats(null);
    };

    if (view === 'profile') {
        if (loading || !selectedUser || !activityStats) return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '1rem' }}>
                <div className="loading-spinner"></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading activity profile...</p>
            </div>
        );

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                {/* Profile View Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={goBackToExplorer} className="btn btn-outline" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedUser.name}</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {selectedUser.role.toUpperCase()} | {selectedUser.department?.departmentName} {selectedUser.class && `| ${selectedUser.class.className}`}
                        </p>
                    </div>
                </div>

                {/* Profile Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {selectedUser.role === 'student' ? (
                        <>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overall Attendance</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-primary)' }}>
                                    {Math.round((activityStats.totalPresent / (activityStats.totalClasses || 1)) * 100)}%
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Classes Attended</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activityStats.totalPresent} / {activityStats.totalClasses}</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Sessions Conducted</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--brand-secondary)' }}>
                                    {activityStats.totalClassesConducted}
                                </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Subjects</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{userSubjects?.length || 0}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Performance & Subjects */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: selectedUser.role === 'teacher' ? '1fr 1fr' : '1fr',
                    gap: '2rem',
                    marginBottom: '2rem'
                }}>
                    {selectedUser.role === 'teacher' && (
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={20} className="text-brand-primary" /> Class Assignments
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {userSubjects.length > 0 ? userSubjects.map((sub, idx) => (
                                    <div key={idx} style={{
                                        padding: '1rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                                                {sub.subjectId?.subjectName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {`${sub.classId?.className} | ${sub.dayOfWeek}`}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.4rem 0.8rem', background: 'var(--brand-primary)15', color: 'var(--brand-primary)', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: '800' }}>
                                            ACTIVE
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>No academic assignments found.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Detailed Activity Feed (Moved into grid) */}
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} className="text-brand-secondary" /> Activity Timeline
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activityStats.history.length > 0 ? activityStats.history.map((record, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--border-color)',
                                }}>
                                    <div style={{
                                        padding: '0.5rem',
                                        borderRadius: '0.5rem',
                                        background: record.status === 'present' || selectedUser.role === 'teacher' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: record.status === 'present' || selectedUser.role === 'teacher' ? 'var(--success)' : 'var(--danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: 'fit-content'
                                    }}>
                                        {selectedUser.role === 'teacher' ? <CheckCircle size={16} /> : (record.status === 'present' ? <CheckCircle size={16} /> : <AlertCircle size={16} />)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                                                {selectedUser.role === 'student'
                                                    ? `Marked ${record.status}`
                                                    : `Class Conducted`}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                                {new Date(record.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {record.subjectId?.subjectName} | {record.classId?.className}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    <p style={{ fontSize: '0.9rem' }}>No recent activity records.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Activity className="text-brand-primary" size={28} /> Activity Explorer
                </h2>
                {error ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                        Identify and track specific user activity
                    </div>
                )}
            </div>

            {/* Selection Flow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {/* Step 1: Department */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-primary)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>STEP 1: SELECT DEPARTMENT</label>
                    <select
                        value={selection.departmentId}
                        onChange={(e) => setSelection({ ...selection, departmentId: e.target.value, classId: '' })}
                        className="input-field"
                        style={{ width: '100%', fontSize: '0.9rem' }}
                    >
                        <option value="">Choose Department...</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                    </select>
                </div>

                {/* Step 2: Role */}
                <div className="glass-panel" style={{ padding: '1.5rem', opacity: selection.departmentId ? 1 : 0.5, pointerEvents: selection.departmentId ? 'all' : 'none' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-secondary)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>STEP 2: SELECT ROLE</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['student', 'teacher'].map(role => (
                            <button
                                key={role}
                                onClick={() => setSelection({ ...selection, role })}
                                style={{
                                    flex: 1,
                                    padding: '0.6rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    background: selection.role === role ? 'var(--brand-primary)' : 'transparent',
                                    color: selection.role === role ? 'white' : 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {role}s
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 3: Class (Conditionally for Students) */}
                <AnimatePresence>
                    {selection.role === 'student' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel"
                            style={{ padding: '1.5rem', opacity: selection.departmentId ? 1 : 0.5, pointerEvents: selection.departmentId ? 'all' : 'none' }}
                        >
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>STEP 3: SELECT CLASS</label>
                            <select
                                value={selection.classId}
                                onChange={(e) => setSelection({ ...selection, classId: e.target.value })}
                                className="input-field"
                                style={{ width: '100%', fontSize: '0.9rem' }}
                            >
                                <option value="">Choose Class...</option>
                                {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                            </select>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results List */}
            <motion.div
                className="glass-panel"
                style={{ padding: '2rem', minHeight: '300px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} /> Match Results ({users.length})
                    </h3>
                    {loading && <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>}
                </div>

                {!selection.departmentId ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                        <ArrowRight size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>Start by selecting a department to explore activity.</p>
                    </div>
                ) : (users.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {users.map(u => (
                            <motion.div
                                key={u._id}
                                whileHover={{ scale: 1.02, x: 5 }}
                                onClick={() => handleUserClick(u)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    padding: '1.25rem',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--brand-primary)20',
                                    color: 'var(--brand-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <User size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                </div>
                                <ChevronRight size={18} style={{ opacity: 0.3 }} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                        <Search size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>No {selection.role}s found for this selection.</p>
                    </div>
                ))}
            </motion.div>

            <style>{`
                .loading-spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default SystemActivity;
