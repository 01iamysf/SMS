import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

const LeavePage = () => {
    const [leaveData, setLeaveData] = useState({ startDate: '', endDate: '', reason: '' });
    const [statusMsg, setStatusMsg] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('/leave/my-leaves');
            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch leave history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/leave/apply', leaveData);
            setStatusMsg({ type: 'success', text: data.message });
            setLeaveData({ startDate: '', endDate: '', reason: '' });
            fetchHistory();
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const groupedHistory = history.reduce((groups, leave) => {
        const date = new Date(leave.startDate);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(leave);
        return groups;
    }, {});

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Form Section */}
            <div className="glass-panel animate-fade-in" style={{ padding: 'clamp(1.25rem, 5vw, 2.5rem)', position: 'sticky', top: '2rem', flex: '1 1 300px', minWidth: 'min(100%, 300px)' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Apply for Leave</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Submit your leave request for coordinator approval.</p>
                </div>

                {statusMsg && (
                    <div style={{ padding: '1rem 1.25rem', marginBottom: '2rem', borderRadius: 'var(--radius-lg)', background: statusMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
                        {statusMsg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Start Date</label>
                            <input type="date" className="input-field" value={leaveData.startDate} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>End Date</label>
                            <input type="date" className="input-field" value={leaveData.endDate} onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })} required />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Reason for Leave</label>
                        <textarea className="input-field" rows="5" value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })} required style={{ resize: 'none' }} placeholder="Example: Medical emergency, Family function..."></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '3.5rem', fontSize: '1rem', fontWeight: '700', marginTop: '1rem' }}>Submit Request</button>
                </form>
            </div>

            {/* History Section */}
            <div className="glass-panel animate-fade-in" style={{ padding: 'clamp(1.25rem, 5vw, 2.5rem)', flex: '1.5 1 400px', minWidth: 'min(100%, 300px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>Leave History</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Month-wise record of your past applications.</p>
                    </div>
                    {history.length > 0 && <span className="badge badge-primary" style={{ padding: '0.5rem 1rem' }}>{history.length} Total</span>}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }} />
                        <p>Syncing your records...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
                        <Calendar size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.1, color: 'var(--brand-primary)' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>No history found</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You haven't applied for any leaves yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {Object.entries(groupedHistory).map(([monthYear, leaves]) => (
                            <div key={monthYear}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {monthYear}
                                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--border-color), transparent)' }} />
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {leaves.map(item => {
                                        const start = new Date(item.startDate);
                                        const end = new Date(item.endDate);
                                        const diffTime = Math.abs(end - start);
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                        return (
                                            <div key={item._id} className="history-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: item.status === 'approved' ? 'var(--success)' : item.status === 'pending' ? 'var(--warning)' : 'var(--danger)' }} />

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{start.toLocaleDateString('default', { day: 'numeric', month: 'short' })}</span>
                                                            <div style={{ width: '12px', height: '1px', background: 'var(--text-light)', opacity: 0.3 }} />
                                                            <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{end.toLocaleDateString('default', { day: 'numeric', month: 'short' })}</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <Clock size={12} /> {diffDays} {diffDays === 1 ? 'Day' : 'Days'} Request
                                                        </span>
                                                    </div>
                                                    <div className={`badge badge-${(new Date() > new Date(item.endDate) && item.status === 'approved') ? 'secondary' : item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em', background: (new Date() > new Date(item.endDate) && item.status === 'approved') ? 'rgba(156, 163, 175, 0.1)' : undefined, color: (new Date() > new Date(item.endDate) && item.status === 'approved') ? 'var(--text-light)' : undefined }}>
                                                        {(new Date() > new Date(item.endDate) && item.status === 'approved') ? 'Leave Ended' : item.status}
                                                    </div>
                                                </div>

                                                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                    <span style={{ color: 'var(--text-light)', fontWeight: '600', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem', opacity: 0.6 }}>Reason</span>
                                                    {item.reason}
                                                </div>

                                                {item.status === 'revoked' && (
                                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                                        <AlertCircle size={14} style={{ color: 'var(--danger)', marginTop: '2px' }} />
                                                        <div>
                                                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Revocation Reason</span>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.revocationReason}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style>{`.history-card { transition: all 0.3s ease; } .history-card:hover { transform: translateX(8px); background: rgba(255,255,255,0.05) !important; border-color: var(--brand-primary) !important; }`}</style>
        </div>
    );
};

export default LeavePage;
