import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Clock, Calendar, AlertCircle, Info, UploadCloud, X, ArrowRightCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RulesModal = ({ onClose }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}
            >
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--brand-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={20} /> Leave Guidelines
                </h3>
                <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1.5rem', margin: 0 }}>
                    <li><strong>Casual & Emergency Leave:</strong> Can be applied for personal or urgent reasons. Maximum 7 consecutive days allowed.</li>
                    <li><strong>Medical Leave:</strong> Requires a valid medical certificate or prescription to be uploaded (PDF/JPG/PNG, max 5MB). Initially restricted to a maximum of 7 days.</li>
                    <li><strong>Extending Medical Leave:</strong> If you need more than 7 days for a medical reason, you can request an extension. Once your initial Medical Leave is approved, an "Extend Leave" button will appear in your Leave History to submit further documentation.</li>
                    <li><strong>Backdating:</strong> Leave applications cannot be submitted for past dates.</li>
                    <li><strong>Approval:</strong> All leaves are subject to approval by your Class Coordinator. Submitting an application does not guarantee approval.</li>
                </ul>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const LeavePage = () => {
    const [leaveData, setLeaveData] = useState({ leaveType: 'Casual', startDate: '', endDate: '', reason: '', document: null, extensionFor: null });
    const [statusMsg, setStatusMsg] = useState('');
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [totalDays, setTotalDays] = useState(0);
    const [formError, setFormError] = useState('');
    const formRef = useRef(null);

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

    // Calculate days and validate dates
    useEffect(() => {
        setFormError('');
        if (leaveData.startDate && leaveData.endDate) {
            const start = new Date(leaveData.startDate);
            const end = new Date(leaveData.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today && !leaveData.extensionFor) {
                setFormError('Start date cannot be in the past.');
                setTotalDays(0);
                return;
            }
            if (end < start) {
                setFormError('End date cannot be before start date.');
                setTotalDays(0);
                return;
            }

            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (['Casual', 'Medical', 'Emergency'].includes(leaveData.leaveType) && diffDays > 7) {
                setFormError(`Maximum 7 days allowed for ${leaveData.leaveType} Leave.`);
                setTotalDays(diffDays);
                return;
            }

            setTotalDays(diffDays);
        } else {
            setTotalDays(0);
        }
    }, [leaveData.startDate, leaveData.endDate, leaveData.leaveType, leaveData.extensionFor]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setStatusMsg('');

        if (totalDays === 0) {
            setFormError('Please select valid dates.');
            return;
        }

        if (['Casual', 'Medical', 'Emergency'].includes(leaveData.leaveType) && totalDays > 7) {
            setFormError(`Maximum 7 days allowed for ${leaveData.leaveType} Leave.`);
            return;
        }

        if (leaveData.leaveType === 'Medical' && !leaveData.document) {
            setFormError('Document upload is mandatory for Medical leave.');
            return;
        }

        const formData = new FormData();
        formData.append('leaveType', leaveData.leaveType);
        formData.append('startDate', leaveData.startDate);
        formData.append('endDate', leaveData.endDate);
        formData.append('reason', leaveData.reason);
        if (leaveData.extensionFor) {
            formData.append('extensionFor', leaveData.extensionFor);
        }
        if (leaveData.document) {
            formData.append('document', leaveData.document);
        }

        try {
            const { data } = await axios.post('/leave/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatusMsg({ type: 'success', text: data.message });
            setLeaveData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '', document: null, extensionFor: null });
            fetchHistory();
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.message || err.message });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormError('');
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setFormError('File size exceeds 5MB limit.');
                e.target.value = null; // reset
                setLeaveData({ ...leaveData, document: null });
                return;
            }
            setLeaveData({ ...leaveData, document: file });
        }
    };

    const handleExtendLeave = (leave) => {
        const endDateObj = new Date(leave.endDate);
        endDateObj.setDate(endDateObj.getDate() + 1); // Next day
        const newStartDate = endDateObj.toISOString().split('T')[0];

        setLeaveData({
            leaveType: 'Medical',
            startDate: newStartDate,
            endDate: '',
            reason: '',
            document: null,
            extensionFor: leave._id
        });
        setStatusMsg('');
        setFormError('');
        
        // Scroll to form
        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const groupedHistory = history.reduce((groups, leave) => {
        const date = new Date(leave.startDate);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[monthYear]) groups[monthYear] = [];
        groups[monthYear].push(leave);
        return groups;
    }, {});

    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate max end date dynamically
    let maxDateStr = '';
    if (leaveData.startDate && ['Casual', 'Medical', 'Emergency'].includes(leaveData.leaveType)) {
        const startObj = new Date(leaveData.startDate);
        startObj.setDate(startObj.getDate() + 6); // Max 7 days total
        maxDateStr = startObj.toISOString().split('T')[0];
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'flex-start', maxWidth: '1400px', margin: '0 auto' }}>
            {showRules && <RulesModal onClose={() => setShowRules(false)} />}
            
            {/* Form Section */}
            <div ref={formRef} className="glass-panel animate-fade-in" style={{ padding: 'clamp(1.25rem, 5vw, 2.5rem)', position: 'sticky', top: '2rem', flex: '1 1 350px', minWidth: 'min(100%, 350px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--brand-primary)', marginBottom: '0.5rem' }}>
                            {leaveData.extensionFor ? 'Extend Medical Leave' : 'Apply for Leave'}
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {leaveData.extensionFor ? 'Provide additional documentation to extend your leave.' : 'Submit your leave request for coordinator approval.'}
                        </p>
                    </div>
                    <button onClick={() => setShowRules(true)} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-primary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} title="Leave Guidelines">
                        <Info size={18} />
                    </button>
                </div>

                {statusMsg && (
                    <div style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-lg)', background: statusMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }} />
                        {statusMsg.text}
                    </div>
                )}
                
                {formError && (
                    <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertCircle size={16} /> {formError}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Leave Type</label>
                        <select className="input-field" value={leaveData.leaveType} onChange={e => setLeaveData({ ...leaveData, leaveType: e.target.value })} required disabled={!!leaveData.extensionFor}>
                            <option value="Casual">Casual Leave</option>
                            <option value="Medical">Medical Leave</option>
                            <option value="Emergency">Emergency Leave</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Start Date</label>
                            <input type="date" className="input-field" min={!leaveData.extensionFor ? todayStr : undefined} value={leaveData.startDate} onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })} required disabled={!!leaveData.extensionFor} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>End Date</label>
                            <input type="date" className="input-field" min={leaveData.startDate || todayStr} max={maxDateStr || undefined} value={leaveData.endDate} onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })} required />
                        </div>
                    </div>

                    {totalDays > 0 && (
                        <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px dashed var(--brand-primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', color: 'var(--brand-primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                            Duration: {totalDays} {totalDays === 1 ? 'Day' : 'Days'} 
                            {['Casual', 'Medical', 'Emergency'].includes(leaveData.leaveType) && <span style={{ opacity: 0.6, display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>(Max 7 days allowed)</span>}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Reason for Leave</label>
                        <textarea className="input-field" rows="4" value={leaveData.reason} onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })} required style={{ resize: 'none' }} placeholder="Provide a detailed reason..."></textarea>
                    </div>

                    {/* Document Upload */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Supporting Document {leaveData.leaveType === 'Medical' && <span style={{ color: 'var(--danger)' }}>* (Required)</span>}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input type="file" id="document-upload" accept=".pdf, .jpg, .jpeg, .png" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, zIndex: 2, cursor: 'pointer', width: '100%', height: '100%' }} />
                            <div className="input-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderStyle: 'dashed', cursor: 'pointer', color: leaveData.document ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                                <UploadCloud size={18} />
                                <span style={{ fontSize: '0.85rem' }}>{leaveData.document ? leaveData.document.name : 'Upload PDF/JPG/PNG (Max 5MB)'}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {leaveData.extensionFor && (
                            <button type="button" onClick={() => setLeaveData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '', document: null, extensionFor: null })} className="btn btn-secondary" style={{ flex: 1, height: '3.5rem', fontSize: '1rem', fontWeight: '700', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                                Cancel Extension
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" style={{ flex: leaveData.extensionFor ? 1.5 : 1, height: '3.5rem', fontSize: '1rem', fontWeight: '700' }}>
                            {leaveData.extensionFor ? 'Submit Extension' : 'Submit Request'}
                        </button>
                    </div>
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
                                        
                                        // Check if this medical leave can be extended
                                        const isApprovedMedical = item.leaveType === 'Medical' && item.status === 'approved';
                                        // A small check: don't show extend if it's already far in the past maybe? For now we just show it.

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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                <Clock size={12} /> {diffDays} {diffDays === 1 ? 'Day' : 'Days'} Request
                                                            </span>
                                                            {item.leaveType && (
                                                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
                                                                    {item.leaveType}
                                                                </span>
                                                            )}
                                                            {item.extensionFor && (
                                                                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '4px', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: '700', letterSpacing: '0.05em' }}>
                                                                    EXTENSION
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                        <div className={`badge badge-${(new Date() > new Date(item.endDate) && item.status === 'approved') ? 'secondary' : item.status === 'approved' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em', background: (new Date() > new Date(item.endDate) && item.status === 'approved') ? 'rgba(156, 163, 175, 0.1)' : undefined, color: (new Date() > new Date(item.endDate) && item.status === 'approved') ? 'var(--text-light)' : undefined }}>
                                                            {(new Date() > new Date(item.endDate) && item.status === 'approved') ? 'Leave Ended' : item.status}
                                                        </div>
                                                        {isApprovedMedical && (
                                                            <button 
                                                                onClick={() => handleExtendLeave(item)}
                                                                style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0' }}
                                                            >
                                                                Extend Leave <ArrowRightCircle size={14} />
                                                            </button>
                                                        )}
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
