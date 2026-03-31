import { Routes, Route } from 'react-router-dom';
import StudentSidebar from '../../components/student/StudentSidebar';
import { useAuth } from '../../context/AuthContext';


import HistoryPage from './HistoryPage';
import StreaksPage from './StreaksPage';
import LeavePage from './LeavePage';
import SubjectsPage from './SubjectsPage';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';
import { Activity, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Shield, Check, Menu } from 'lucide-react';
import NotificationDropdown from '../../components/shared/NotificationDropdown';
import ThemeToggle from '../../components/shared/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const StudentOverview = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const canView = user?.permissions?.includes('viewAttendance');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, subjectsRes] = await Promise.all([
                    canView ? axios.get('/student/overview') : Promise.resolve({ data: null }),
                    axios.get('/student/subjects')
                ]);
                setStats(statsRes.data);
                setSubjects(subjectsRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };
        fetchDashboardData();
    }, [canView]);

    const getDisplayStats = () => {
        if (!stats) return { totalClasses: 0, totalPresent: 0, totalAbsent: 0, history: [] };
        if (!selectedDate) return stats;

        const historyOnDate = stats.history?.filter(h => isSameDay(new Date(h.date), selectedDate)) || [];
        return {
            totalClasses: historyOnDate.length > 0 ? 1 : 0,
            totalPresent: historyOnDate.filter(h => h.status === 'present').length,
            totalAbsent: historyOnDate.filter(h => h.status === 'absent').length,
            history: historyOnDate
        };
    };

    const renderCalendar = () => {
        if (!canView) return null;
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrMonth = isSameMonth(day, monthStart);

                const recordsOnDay = stats?.history?.filter(h => isSameDay(new Date(h.date), cloneDay)) || [];
                const hasPresent = recordsOnDay.some(h => h.status === 'present');
                const hasAbsent = recordsOnDay.some(h => h.status === 'absent');

                days.push(
                    <div
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : cloneDay)}
                        style={{
                            flex: 1, height: '40px', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            borderRadius: '0.5rem',
                            background: isSelected ? 'var(--brand-primary)' : 'transparent',
                            color: isSelected ? 'white' : (isCurrMonth ? 'var(--text-primary)' : 'var(--text-light)'),
                            opacity: isCurrMonth ? 1 : 0.4,
                            position: 'relative',
                            transition: 'all 0.2s',
                            border: '1px solid transparent'
                        }}
                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <span style={{ fontSize: '0.875rem', zIndex: 1, fontWeight: isSelected ? 'bold' : 'normal' }}>{formattedDate}</span>
                        {!isSelected && (hasPresent || hasAbsent) && (
                            <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px' }}>
                                {hasPresent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16a34a' }} />}
                                {hasAbsent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#dc2626' }} />}
                            </div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(<div key={day} style={{ display: 'flex', marginTop: '4px' }}>{days}</div>);
            days = [];
        }

        const weekDays = [];
        let weekStartDate = startOfWeek(currentMonth);
        for (let i = 0; i < 7; i++) {
            weekDays.push(
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {format(addDays(weekStartDate, i), 'eeeee')}
                </div>
            );
        }

        return (
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem' }}>{format(currentMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', marginBottom: '1rem' }}>{weekDays}</div>
                <div>{rows}</div>
            </div>
        );
    };

    const displayStats = getDisplayStats();

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Dashboard Header & Animated Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Student Overview</h2>
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
                    <Activity size={18} style={{ zIndex: 2, position: 'relative' }} />
                    <span style={{ zIndex: 2, position: 'relative' }}>Generate Report</span>
                </motion.button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* LEFT: Stats */}
                <div style={{ flex: '1 1 0%', minWidth: '300px' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                <Activity size={18} /> Attendance Stats
                            </h3>
                            {selectedDate && (
                                <button
                                    onClick={() => setSelectedDate(null)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                >
                                    <X size={12} /> Clear Filter
                                </button>
                            )}
                        </div>

                        {!canView ? (
                            <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', opacity: 0.6 }}>
                                <Shield size={32} style={{ marginBottom: '0.5rem', color: 'var(--text-light)' }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Attendance reporting is disabled for your account.</p>
                            </div>
                        ) : (
                            <>
                                {selectedDate && (
                                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--brand-primary)', color: 'white', borderRadius: '0.5rem', textAlign: 'center', fontWeight: '500', fontSize: '0.875rem' }}>
                                        Showing stats for: {format(selectedDate, 'MMMM d, yyyy')}
                                    </div>
                                )}

                                {/* Streak Highlight */}
                                {!selectedDate && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fff 0%, #fff7ed 100%)', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontSize: '2rem' }}>🔥</div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ea580c' }}>{stats?.streakCount || 0}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#9a3412', textTransform: 'uppercase' }}>Current Streak</div>
                                            </div>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontSize: '2rem' }}>🏆</div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a' }}>{stats?.bestStreak || 0}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#166534', textTransform: 'uppercase' }}>Best Streak</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                                    <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{displayStats.totalClasses}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Total</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{displayStats.totalPresent}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Present</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{displayStats.totalAbsent}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Absent</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT: Calendar Filter */}
                <div style={{ width: '100%', maxWidth: '350px', flexShrink: 0 }}>
                    {canView && renderCalendar()}
                </div>
            </div>

            {/* Today's Schedule */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={18} /> {selectedDate ? `Schedule for ${format(selectedDate, 'MMM d')}` : "Today's Schedule"}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {(subjects.filter(s => {
                        const dayName = format(selectedDate || new Date(), 'EEEE');
                        return s.dayOfWeek === dayName;
                    })).length > 0 ? (
                        subjects.filter(s => {
                            const dayName = format(selectedDate || new Date(), 'EEEE');
                            return s.dayOfWeek === dayName;
                        }).sort((a, b) => {
                            const t = (s) => {
                                if (!s) return 0;
                                const [h, m] = s.split(' ')[0].split(':');
                                let hh = parseInt(h);
                                if (s.includes('PM') && hh !== 12) hh += 12;
                                if (s.includes('AM') && hh === 12) hh = 0;
                                return hh * 60 + parseInt(m);
                            };
                            return t(a.startTime) - t(b.startTime);
                        }).map((s, i) => (
                            <div key={s._id || i} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--brand-primary)' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.subjectId?.subjectName || s.subjectName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.startTime} - {s.endTime}</div>
                                {s.teacherId?.name && <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: '0.25rem' }}>{s.teacherId.name}</div>}
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                            No scheduled classes for this day.
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM: Attendance Details Table */}
            {canView && (
                <div style={{ width: '100%', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        Attendance Details {selectedDate && `for ${format(selectedDate, 'MMMM d, yyyy')}`}
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Date</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Subject</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Time</th>
                                    <th style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayStats.history?.length > 0 ? displayStats.history.map((record, index) => (
                                    <tr key={record._id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            {format(new Date(record.date), 'MMM d, yyyy')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                            {record.subjectId?.subjectName || 'Unknown Subject'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {record.time || 'N/A'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: record.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: record.status === 'present' ? '#10b981' : '#ef4444'
                                            }}>
                                                {record.status === 'present' ? 'Present' : 'Absent'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                            No attendance records found{selectedDate && ' for this date'}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
const StudentDashboard = () => {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    return (
        <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
            <StudentSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="dashboard-main">

                <header className="glass-panel dashboard-header">
                    <div className="flex-row-mobile">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={24} />
                            </button>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Student Portal</h1>
                        </div>
                    </div>
                    <div className="dashboard-header-actions">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="group">
                            <div style={{
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: 'var(--warning)',
                                cursor: 'help',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}>
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                                    <Shield size={18} />
                                </motion.div>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Account Level</span>
                            </div>

                            <div className="permissions-tooltip" style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '240px',
                                background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '1rem',
                                boxShadow: 'var(--shadow-xl)', padding: '1rem', zIndex: 1000,
                                visibility: 'hidden', opacity: 0, transition: 'all 0.2s'
                            }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Student Status</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                                        <Check size={14} className="text-success" />
                                        <span style={{ fontWeight: '700' }}>Active Enrollment</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: user?.streakCount > 0 ? 'var(--text-primary)' : 'var(--text-light)' }}>
                                        {user?.streakCount > 0 ? <Check size={14} className="text-success" /> : <X size={14} className="text-danger" />}
                                        <span style={{ fontWeight: user?.streakCount > 0 ? '700' : '400' }}>Attendance Streak: {user?.streakCount || 0}d</span>
                                    </div>
                                </div>
                                <style>{`.group:hover .permissions-tooltip { visibility: visible !important; opacity: 1 !important; transform: translateY(5px); }`}</style>
                            </div>
                        </div>

                        <ThemeToggle />
                        <NotificationDropdown />
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<StudentOverview />} />

                        <Route path="/history" element={user?.permissions?.includes('viewAttendance') ? <HistoryPage /> : <StudentOverview />} />
                        <Route path="/streaks" element={<StreaksPage />} />
                        <Route path="/leaves" element={<LeavePage />} />
                        <Route path="/subjects" element={<SubjectsPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
