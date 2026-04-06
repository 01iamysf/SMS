import React from 'react';
import { Clock, MapPin, User, BookOpen } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM'
];

const TimetableGrid = ({ subjects = [], hideTeacher = false }) => {
    // Group subjects by day and then by time slot
    const getSubjectForSlot = (day, slot) => {
        return subjects.find(s =>
            s.dayOfWeek === day &&
            (s.timeSlot === slot || (s.startTime && slot.startsWith(s.startTime)))
        );
    };

    const unscheduledSubjects = subjects.filter(s => !s.dayOfWeek);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)`,
                    minWidth: '1000px',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)'
                }}>
                    {/* Header Row */}
                    <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', fontWeight: '800', textAlign: 'center', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</div>
                    {DAYS.map(day => (
                        <div key={day} style={{ background: 'var(--bg-primary)', padding: '1.25rem', fontWeight: '800', color: 'var(--brand-primary)', textAlign: 'center', borderBottom: '2px solid var(--border-color)', borderRight: day !== 'Saturday' ? '1px solid var(--border-color)' : 'none', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {day}
                        </div>
                    ))}

                    {/* Time Slot Rows */}
                    {TIME_SLOTS.map((slot, rowIndex) => (
                        <React.Fragment key={slot}>
                            {/* Time Label Cell */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderBottom: rowIndex !== TIME_SLOTS.length - 1 ? '1px solid var(--border-color)' : 'none',
                                borderRight: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                fontWeight: '600',
                                fontSize: '0.75rem'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} opacity={0.6} />
                                    <span>{slot.split(' - ')[0]}</span>
                                    <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>to</span>
                                    <span>{slot.split(' - ')[1]}</span>
                                </div>
                            </div>

                            {/* Day Cells for this slot */}
                            {DAYS.map((day, colIndex) => {
                                const sub = getSubjectForSlot(day, slot);
                                return (
                                    <div key={`${day}-${slot}`} style={{
                                        background: 'var(--bg-primary)',
                                        padding: '0.75rem',
                                        minHeight: '120px',
                                        borderBottom: rowIndex !== TIME_SLOTS.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        borderRight: colIndex !== DAYS.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}>
                                        {sub ? (
                                            <div
                                                style={{
                                                    padding: '1rem',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: '0.75rem',
                                                    border: '1px solid var(--border-color)',
                                                    borderLeft: `4px solid var(--brand-primary)`,
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                                                    {sub.subjectId?.subjectName || sub.subjectName || 'Unknown Subject'}
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <MapPin size={12} style={{ opacity: 0.7 }} /> {sub.roomNumber || 'Room TBD'}
                                                    </div>
                                                    {!hideTeacher && sub.teacherId?.name && (
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '600' }}>
                                                            <User size={12} style={{ opacity: 0.8 }} /> {sub.teacherId.name}
                                                        </div>
                                                    )}
                                                </div>

                                                {sub.classId?.className && (
                                                    <div style={{
                                                        marginTop: 'auto',
                                                        fontSize: '0.65rem',
                                                        color: 'var(--text-light)',
                                                        padding: '0.25rem 0.5rem',
                                                        background: 'var(--bg-primary)',
                                                        borderRadius: '0.4rem',
                                                        width: 'fit-content',
                                                        fontWeight: '500'
                                                    }}>
                                                        {sub.classId.className}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', opacity: 0.3, fontSize: '0.7rem', fontStyle: 'italic' }}>
                                                -
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Unscheduled Subjects Section */}
            {unscheduledSubjects.length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={24} className="text-brand-primary" /> Individually Assigned Subjects
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {unscheduledSubjects.map((sub, idx) => (
                            <div
                                key={sub._id || idx}
                                style={{
                                    padding: '1.5rem',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--border-color)',
                                    borderLeft: '4px solid #10b981',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                        {sub.subjectId?.subjectName || sub.subjectName || 'Unknown Subject'}
                                    </div>
                                    {sub.timeSlot && (
                                        <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Clock size={14} /> {sub.timeSlot}
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                    Individually assigned by administration. No periodic weekly schedule is set for this enrollment.
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimetableGrid;
