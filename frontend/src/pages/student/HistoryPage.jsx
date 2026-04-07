import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarDays, RotateCcw, Filter } from 'lucide-react';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get('/student/overview');
                setHistory(data.history || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    /* ── Client-side date filtering ── */
    const filtered = useMemo(() => {
        if (!startDate && !endDate) return history;
        return history.filter(record => {
            const recordDate = new Date(record.date);
            if (startDate && endDate) {
                return isWithinInterval(recordDate, {
                    start: startOfDay(parseISO(startDate)),
                    end: endOfDay(parseISO(endDate))
                });
            }
            if (startDate) return recordDate >= startOfDay(parseISO(startDate));
            if (endDate) return recordDate <= endOfDay(parseISO(endDate));
            return true;
        });
    }, [history, startDate, endDate]);

    const totalFiltered = filtered.length;
    const presentFiltered = filtered.filter(r => r.status === 'present').length;
    const absentFiltered = filtered.filter(r => r.status === 'absent').length;
    const isFiltering = startDate || endDate;

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
    };

    return (
        <motion.div
            className="glass-panel animate-fade-in"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '2rem' }}
        >
            {/* Page Title */}
            <h2 style={{
                fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem',
                color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
                <CalendarDays size={20} /> Attendance History
            </h2>

            {/* ── Date-Range Filter Bar ── */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                alignItems: 'flex-end',
                marginBottom: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)'
            }}>
                <Filter size={16} style={{ color: 'var(--brand-primary)', marginBottom: '2px', flexShrink: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={e => setStartDate(e.target.value)}
                        style={{
                            padding: '0.45rem 0.65rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={e => setEndDate(e.target.value)}
                        style={{
                            padding: '0.45rem 0.65rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    />
                </div>

                {isFiltering && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleReset}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.45rem 0.85rem',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#dc2626',
                            border: '1px solid rgba(239,68,68,0.25)',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            alignSelf: 'flex-end'
                        }}
                    >
                        <RotateCcw size={13} /> Reset
                    </motion.button>
                )}

                {/* Filter summary chips */}
                {isFiltering && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
                        <SummaryChip label="Total" value={totalFiltered} color="var(--brand-primary)" />
                        <SummaryChip label="Present" value={presentFiltered} color="#16a34a" />
                        <SummaryChip label="Absent" value={absentFiltered} color="#dc2626" />
                    </div>
                )}
            </div>

            {/* ── Active-filter notice ── */}
            {isFiltering && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                        marginBottom: '1rem',
                        padding: '0.6rem 1rem',
                        background: 'rgba(99,102,241,0.08)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(99,102,241,0.2)',
                        fontSize: '0.8rem',
                        color: 'var(--brand-primary)',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <CalendarDays size={14} />
                    Showing {totalFiltered} record{totalFiltered !== 1 ? 's' : ''}
                    {startDate && ` from ${format(parseISO(startDate), 'MMM d, yyyy')}`}
                    {endDate && ` to ${format(parseISO(endDate), 'MMM d, yyyy')}`}
                </motion.div>
            )}

            {/* ── Table ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Loading attendance records…
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Date</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Subject</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Time</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map((record, index) => (
                                <motion.tr
                                    key={record._id || index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    style={{ borderBottom: '1px solid var(--border-color)' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                        {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                        {record.subjectId?.subjectName || 'Unknown Subject'}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {record.time || 'N/A'}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: record.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: record.status === 'present' ? '#10b981' : '#ef4444'
                                        }}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {record.method || '—'}
                                    </td>
                                </motion.tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                                        {isFiltering
                                            ? 'No records found for the selected date range.'
                                            : 'No attendance records found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </motion.div>
    );
};

const SummaryChip = ({ label, value, color }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.3rem 0.6rem',
        borderRadius: '999px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        fontSize: '0.75rem'
    }}>
        <span style={{ fontWeight: '800', color }}>{value}</span>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
);

export default HistoryPage;
