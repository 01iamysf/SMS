import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, Award, AlertCircle, ChevronRight, Activity, TrendingUp, History, Bell, ShieldCheck, Menu } from 'lucide-react';
import ParentSidebar from '../../components/parent/ParentSidebar';
import NotificationDropdown from '../../components/shared/NotificationDropdown';
import ThemeToggle from '../../components/shared/ThemeToggle';

const SummaryView = ({ childrenData, selectedChildId, loading }) => {
    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading children data...</div>;
    if (!childrenData || childrenData.length === 0) return (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px dashed var(--border-color)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-light)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>No Children Linked</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please contact the administrator to link your student accounts.</p>
        </div>
    );

    // Filter for selected child if multiple children exist
    const displayData = childrenData.filter(child => !selectedChildId || child.studentId === selectedChildId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {displayData.map((child, idx) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={child.studentId}
                    className="glass-panel"
                    style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
                >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'var(--brand-primary)', opacity: 0.05, borderRadius: '0 0 0 100%', pointerEvents: 'none' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{child.name}</h2>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Activity size={14} /> Overall Attendance</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: parseFloat(child.attendancePercentage) >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                                {child.attendancePercentage}%
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-light)', textTransform: 'uppercase' }}>Current Status</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                <Calendar size={18} />
                                <span style={{ fontWeight: '500' }}>Class Stats</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{child.presentClasses} / {child.totalClasses}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Attended Sessions</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                <Award size={18} />
                                <span style={{ fontWeight: '500' }}>Attendance Streak</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{child.currentStreak} Days</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Current Active Streak</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Best: {child.bestStreak}</div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                <AlertCircle size={18} />
                                <span style={{ fontWeight: '500' }}>Absences</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{child.totalClasses - child.presentClasses - child.leaveClasses}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Total Missed Classes</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                <ShieldCheck size={18} />
                                <span style={{ fontWeight: '500' }}>Leave Stats</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{child.leaveClasses} Sessions</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Approved Leave Sessions</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const HistoryView = ({ childrenData, selectedChildId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedChildId) {
            const fetchHistory = async () => {
                setLoading(true);
                try {
                    const { data } = await axios.get('/parent/student-attendance');
                    // Filter history for selected child
                    const filtered = data.filter(h => h.studentId?._id === selectedChildId || h.studentId === selectedChildId);
                    setHistory(filtered);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [selectedChildId]);

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <History size={24} className="text-brand" /> Detailed History
                </h2>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading history records...</div>
            ) : history.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Subject</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.sort((a, b) => new Date(b.date) - new Date(a.date)).map((rec, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={rec._id}
                                    style={{ background: 'var(--bg-secondary)', transition: 'transform 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.005)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <td style={{ padding: '1rem', borderRadius: '0.75rem 0 0 0.75rem', fontWeight: '500' }}>{new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                    <td style={{ padding: '1rem' }}>{rec.subjectId?.subjectName || 'Unknown'}</td>
                                    <td style={{ padding: '1rem', borderRadius: '0 0.75rem 0.75rem 0' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: rec.status === 'present' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: rec.status === 'present' ? 'var(--success)' : 'var(--danger)'
                                        }}>
                                            {rec.status.toUpperCase()}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '1rem', color: 'var(--text-secondary)' }}>
                    No attendance history found for this period.
                </div>
            )}
        </div>
    );
};

const LeavesView = ({ childrenData, selectedChildId }) => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedChildId) {
            const fetchLeaves = async () => {
                setLoading(true);
                try {
                    const { data } = await axios.get('/parent/student-leaves');
                    const filtered = data.filter(l => l.userId?._id === selectedChildId || l.userId === selectedChildId);
                    setLeaves(filtered);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchLeaves();
        }
    }, [selectedChildId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'var(--success)';
            case 'pending': return 'var(--brand-primary)';
            case 'rejected': return 'var(--danger)';
            case 'revoked': return 'var(--text-light)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={24} className="text-brand" /> Leave Applications
                </h2>

                {childrenData && childrenData.length > 1 && (
                    <select
                        className="input-field"
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
                    >
                        {childrenData.map(c => <option key={c.studentId} value={c.studentId}>{c.name}</option>)}
                    </select>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading leave records...</div>
            ) : leaves.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-light)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Duration</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Reason</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((l, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={l._id}
                                    style={{ background: 'var(--bg-secondary)' }}
                                >
                                    <td style={{ padding: '1rem', borderRadius: '0.75rem 0 0 0.75rem' }}>
                                        <div style={{ fontWeight: '600' }}>
                                            {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            Applied on {new Date(l.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{l.reason}</div>
                                    </td>
                                    <td style={{ padding: '1rem', borderRadius: '0 0.75rem 0.75rem 0' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            background: (new Date() > new Date(l.endDate) && l.status === 'approved') ? 'rgba(156, 163, 175, 0.15)' : `${getStatusColor(l.status)}15`,
                                            color: (new Date() > new Date(l.endDate) && l.status === 'approved') ? 'var(--text-light)' : getStatusColor(l.status),
                                            border: (new Date() > new Date(l.endDate) && l.status === 'approved') ? '1px solid rgba(156, 163, 175, 0.3)' : `1px solid ${getStatusColor(l.status)}30`
                                        }}>
                                            {(new Date() > new Date(l.endDate) && l.status === 'approved') ? 'Leave Ended' : l.status}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '1rem', color: 'var(--text-secondary)' }}>
                    No leave applications found for this student.
                </div>
            )}
        </div>
    );
};

const ParentDashboard = () => {
    const [childrenData, setChildrenData] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchChildrenData = async () => {
            try {
                const { data } = await axios.get('/parent/student-summary');
                setChildrenData(data);
                if (data.length > 0) {
                    setSelectedChildId(data[0].studentId);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchChildrenData();
    }, []);

    return (
        <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
            <ParentSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="dashboard-main">
                <header className="glass-panel dashboard-header" style={{ marginBottom: '1rem' }}>
                    <div className="flex-row-mobile">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Parent Monitoring</h1>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'none' }}>Overview of student attendance.</p>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-header-actions">
                        <NotificationDropdown />
                        <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingUp size={18} className="text-brand" />
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', display: 'none' }}>Real-time Sync Active</div>
                        </div>
                    </div>
                </header>

                {childrenData.length > 1 && (
                    <div className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
                            <Users size={20} className="text-brand" />
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Select Child:</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {childrenData.map(child => (
                                <button
                                    key={child.studentId}
                                    onClick={() => setSelectedChildId(child.studentId)}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '0.75rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        background: selectedChildId === child.studentId ? 'var(--brand-primary)' : 'var(--bg-secondary)',
                                        color: selectedChildId === child.studentId ? 'white' : 'var(--text-secondary)',
                                        border: '1px solid',
                                        borderColor: selectedChildId === child.studentId ? 'var(--brand-primary)' : 'var(--border-color)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {child.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<SummaryView childrenData={childrenData} selectedChildId={selectedChildId} loading={loading} />} />
                        <Route path="/history" element={<HistoryView childrenData={childrenData} selectedChildId={selectedChildId} />} />
                        <Route path="/leaves" element={<LeavesView childrenData={childrenData} selectedChildId={selectedChildId} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default ParentDashboard;
