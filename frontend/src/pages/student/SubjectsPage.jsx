import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BookOpen, User, Calendar } from 'lucide-react';
import TimetableGrid from '../../components/shared/TimetableGrid';

const SubjectsPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('grid'); // 'grid' or 'timetable'

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const { data } = await axios.get('/student/subjects');
                setSubjects(data);
            } catch (err) {
                console.error('Failed to fetch subjects:', err);
                setError('Failed to load subjects. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchSubjects();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading subjects...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>{error}</div>;

    return (
        <div className="animate-fade-in" style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>My Academic Schedule</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View your weekly subjects and timetable.</p>
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setView('timetable')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                            background: view === 'timetable' ? 'var(--brand-primary)' : 'transparent',
                            color: view === 'timetable' ? 'white' : 'var(--text-secondary)',
                            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Calendar size={18} /> Timetable
                    </button>
                    <button
                        onClick={() => setView('grid')}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none',
                            background: view === 'grid' ? 'var(--brand-primary)' : 'transparent',
                            color: view === 'grid' ? 'white' : 'var(--text-secondary)',
                            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <BookOpen size={18} /> Subjects
                    </button>
                </div>
            </div>

            {subjects.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                    <p>No subjects have been assigned to your class yet.</p>
                </div>
            ) : view === 'timetable' ? (
                <TimetableGrid subjects={subjects} />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {subjects.map((subject, index) => (
                        <motion.div
                            key={subject._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                borderTop: subject.isIndividuallyAssigned ? '4px solid #10b981' : '4px solid var(--brand-primary)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                position: 'relative'
                            }}
                        >
                            {subject.isIndividuallyAssigned ? (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '1rem', fontWeight: 'bold' }}>
                                    Individual
                                </div>
                            ) : (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--brand-primary)', borderRadius: '1rem', fontWeight: 'bold' }}>
                                    Class Subject
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '0.5rem',
                                    background: subject.isIndividuallyAssigned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                                    color: subject.isIndividuallyAssigned ? '#10b981' : 'var(--brand-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <BookOpen size={20} />
                                </div>
                                <div style={{ paddingRight: '3rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                                        {subject.subjectId?.subjectName || 'Unknown Subject'}
                                    </h3>
                                    {(subject.startTime || subject.timeSlot) && (
                                        <div style={{ fontSize: '0.875rem', color: subject.isIndividuallyAssigned ? '#10b981' : 'var(--brand-primary)', fontWeight: '500', marginTop: '0.25rem' }}>
                                            {subject.startTime ? `${subject.startTime} - ${subject.endTime}` : subject.timeSlot}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                marginTop: 'auto', padding: '0.75rem', background: 'var(--bg-primary)',
                                borderRadius: '0.5rem', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <User size={16} color="var(--text-secondary)" />
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taught By</div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                                        {subject.teacherId ? subject.teacherId.name : 'Unassigned'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubjectsPage;
