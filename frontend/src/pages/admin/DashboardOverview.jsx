import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Users,
    UserCheck,
    School,
    BookOpen,
    TrendingUp,
    AlertCircle,
    Clock,
    ChevronRight,
    Activity,
    ShieldCheck
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-panel"
        style={{ padding: '1.5rem', flex: 1, minWidth: '200px' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>{title}</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-primary)' }}>{value}</h3>
            </div>
            <div style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: `${color}15`,
                color: color
            }}>
                <Icon size={24} />
            </div>
        </div>
    </motion.div>
);

const DashboardOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students'); // 'students' or 'teachers'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get('/admin/dashboard-stats');
                setStats(data);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
                <Activity className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading system overview...
            </div>
        );
    }

    if (!stats) return <div className="glass-panel">Error loading statistics.</div>;

    const { counts, todayAttendance, teacherAttendance, trend, teacherTrend, recentActivities } = stats;

    const activeData = activeTab === 'students' ? todayAttendance : teacherAttendance;
    const activeTrend = activeTab === 'students' ? trend : teacherTrend;

    const attendanceRate = activeData.total > 0
        ? ((activeData.present / activeData.total) * 100).toFixed(1)
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Stat Cards */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <StatCard
                    title="Total Students"
                    value={counts.students}
                    icon={Users}
                    color="#3b82f6"
                    delay={0.1}
                />
                <StatCard
                    title="Faculty Members"
                    value={counts.teachers}
                    icon={UserCheck}
                    color="#ec4899"
                    delay={0.2}
                />
                <StatCard
                    title="Active Classes"
                    value={counts.classes}
                    icon={School}
                    color="#10b981"
                    delay={0.3}
                />
                <StatCard
                    title="Total Subjects"
                    value={counts.subjects}
                    icon={BookOpen}
                    color="#f59e0b"
                    delay={0.4}
                />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Today's Attendance Snapshot (Dual View) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-panel"
                    style={{ flex: 1, minWidth: '350px', padding: '1.5rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} className="text-brand" /> Today's Attendance Snapshot
                        </h3>
                        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '10px', gap: '0.2rem' }}>
                            <button
                                onClick={() => setActiveTab('students')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === 'students' ? 'var(--brand-primary)' : 'transparent',
                                    color: activeTab === 'students' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >Students</button>
                            <button
                                onClick={() => setActiveTab('teachers')}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeTab === 'teachers' ? 'var(--brand-primary)' : 'transparent',
                                    color: activeTab === 'teachers' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}
                            >Teachers</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                                <motion.circle
                                    initial={{ strokeDasharray: "0, 100" }}
                                    animate={{ strokeDasharray: `${attendanceRate}, 100` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    cx="18" cy="18" r="16" fill="none" stroke="var(--brand-primary)"
                                    strokeWidth="3"
                                />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{attendanceRate}%</span>
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Present</span>
                                <span style={{ fontWeight: '600', color: 'var(--success)' }}>{activeData.present}</span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(activeData.present / activeData.total) * 100}%` }}
                                    style={{ height: '100%', background: 'var(--success)' }}
                                ></motion.div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Absent</span>
                                <span style={{ fontWeight: '600', color: 'var(--danger)' }}>
                                    {activeTab === 'students' ? activeData.absent : (activeData.total - activeData.present)}
                                </span>
                            </div>
                            <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((activeTab === 'students' ? activeData.absent : (activeData.total - activeData.present)) / activeData.total) * 100}%` }}
                                    style={{ height: '100%', background: 'var(--danger)' }}
                                ></motion.div>
                            </div>

                            {activeTab === 'students' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>On Leave</span>
                                    <span style={{ fontWeight: '600', color: 'var(--brand-primary)' }}>{activeData.leave}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Weekly Trend Bar Chart */}
                    <div style={{ marginTop: '2.5rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100px', gap: '0.75rem' }}>
                            {activeTrend?.length > 0 ? activeTrend.map((day, idx) => {
                                // For students, use day.total. For teachers, use stats.counts.teachers as total in trend is mocked for them.
                                const dayTotal = activeTab === 'students' ? (day.present + day.absent + day.leave) : (stats.counts.teachers);
                                const rate = dayTotal > 0 ? (day.present / dayTotal) * 100 : 0;
                                const date = new Date(day._id);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                const isToday = idx === activeTrend.length - 1;

                                return (
                                    <div key={day._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '100%',
                                            height: '80px',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '8px',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: isToday ? '1px solid var(--brand-primary)40' : 'none'
                                        }}>
                                            <motion.div
                                                key={`${activeTab}-${day._id}`}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${rate}%` }}
                                                transition={{ delay: 0.2 + (idx * 0.05), duration: 0.5 }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    width: '100%',
                                                    background: isToday
                                                        ? 'linear-gradient(to top, var(--brand-primary), var(--brand-secondary))'
                                                        : 'linear-gradient(to top, var(--brand-primary)80, var(--brand-secondary)80)',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                            <div style={{ position: 'absolute', top: '4px', width: '100%', textAlign: 'center', fontSize: '0.6rem', fontWeight: 'bold', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                                {rate > 0 ? `${Math.round(rate)}%` : ''}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: isToday ? '700' : '500',
                                            color: isToday ? 'var(--brand-primary)' : 'var(--text-light)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {dayName}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem', padding: '1rem' }}>
                                    Historical trend data will appear once attendance is marked.
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Recent Activities */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass-panel"
                    style={{ flex: 1.5, minWidth: '400px', padding: '1.5rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} className="text-brand" /> Recent System Logs
                        </h3>
                        <button className="text-brand" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>View All</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentActivities.length > 0 ? recentActivities.map((activity, idx) => (
                            <div key={activity._id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                borderLeft: `4px solid ${activity.status === 'present' ? 'var(--success)' : activity.status === 'absent' ? 'var(--danger)' : 'var(--brand-primary)'}`
                            }}>
                                <div style={{ minWidth: '40px', textAlign: 'center' }}>
                                    <ShieldCheck size={18} color="var(--text-light)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                        {activity.studentId?.name} - <span style={{ opacity: 0.7 }}>{activity.subjectId?.subjectName}</span>
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        Marked as <span style={{ textTransform: 'uppercase', fontWeight: '600' }}>{activity.status}</span> • {new Date(activity.createdAt).toLocaleTimeString()}
                                        {activity.studentId?.departmentId?.departmentName && (
                                            <span style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.05rem 0.4rem', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                                {activity.studentId.departmentId.departmentName}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <ChevronRight size={16} color="var(--text-light)" />
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No recent activities found.</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Teacher Performance & Metrics Section */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="glass-panel"
                    style={{ flex: 2, minWidth: '400px', padding: '1.5rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} className="text-brand" /> Teacher Activity Overview
                        </h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Top Performers</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {stats.teacherPerformance?.map((tp, idx) => (
                            <div key={tp._id} style={{
                                padding: '1.25rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '16px',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'var(--brand-primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold'
                                }}>
                                    {tp.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.125rem' }}>{tp.name}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{tp.email}</p>
                                        </div>
                                        {tp.department ? (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--brand-primary)10', color: 'var(--brand-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                                                {tp.department}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', background: 'var(--bg-primary)', color: 'var(--text-light)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                No Dept
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', flex: 1, marginRight: '1rem', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min((tp.markingCount / 50) * 100, 100)}%`,
                                                height: '100%',
                                                background: 'linear-gradient(90deg, var(--brand-primary), #ec4899)',
                                                borderRadius: '3px'
                                            }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{tp.markingCount} marks</span>
                                    </div>
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: '-0.5rem',
                                    right: '1rem',
                                    background: 'gold',
                                    color: 'black',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    display: idx === 0 ? 'block' : 'none'
                                }}>#1 Rank</div>
                            </div>
                        ))}
                        {(!stats.teacherPerformance || stats.teacherPerformance.length === 0) && (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No performance data available yet.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default DashboardOverview;
