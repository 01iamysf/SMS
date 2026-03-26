import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Adjust route to use the overview endpoint
                const { data } = await axios.get('/student/overview');
                setHistory(data.history || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--brand-primary)' }}>Attendance History</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Subject</th>
                            <th style={{ padding: '0.75rem' }}>Time</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length > 0 ? history.map((record, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.75rem' }}>{new Date(record.date).toLocaleDateString()}</td>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{record.subjectId?.subjectName || 'Unknown Subject'}</td>
                                <td style={{ padding: '0.75rem' }}>{record.time || 'N/A'}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.875rem', background: record.status === 'present' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: record.status === 'present' ? 'var(--success)' : 'var(--danger)' }}>
                                        {record.status}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{record.method}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>No attendance records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryPage;
