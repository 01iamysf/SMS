import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, UserCheck, Plus, Check, Calendar, Clock, MapPin, Building2, ChevronRight, LayoutGrid, X } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM'
];

const Assignments = () => {
    const [activeTab, setActiveTab] = useState('subject'); // 'subject' or 'coordinator'

    // Data states
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    // Form states
    const [subjectForm, setSubjectForm] = useState({ departmentId: '', classId: '', teacherId: '', subjectId: '', timeSlot: '', roomNumber: '', dayOfWeek: '', startTime: '', endTime: '' });
    const [coordinatorForm, setCoordinatorForm] = useState({ departmentId: '', classId: '', teacherId: '' });

    // UI states
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [fetchError, setFetchError] = useState('');

    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [deptRes, teacherRes, subjectRes] = await Promise.all([
                axios.get('/admin/departments'),
                axios.get('/admin/teachers'),
                axios.get('/admin/subjects')
            ]);
            setDepartments(deptRes.data);
            setTeachers(teacherRes.data);
            setSubjects(subjectRes.data);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
            setFetchError(error.response?.data?.message || error.message || "Failed to load data");
        }
    };

    // Fetch classes when department changes
    useEffect(() => {
        const fetchClasses = async (deptId) => {
            if (!deptId) return setClasses([]);
            try {
                const res = await axios.get(`/admin/classes?departmentId=${deptId}`);
                setClasses(res.data);
            } catch (error) {
                console.error("Failed to fetch classes", error);
            }
        };

        const activeDeptId = activeTab === 'subject' ? subjectForm.departmentId : coordinatorForm.departmentId;
        fetchClasses(activeDeptId);
    }, [subjectForm.departmentId, coordinatorForm.departmentId, activeTab]);

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        let startTime = '';
        let endTime = '';
        if (selectedTime) {
            const parts = selectedTime.split(' - ');
            startTime = parts[0];
            endTime = parts[1];
        }

        const payload = {
            ...subjectForm,
            dayOfWeek: selectedDay,
            startTime,
            endTime
        };

        try {
            await axios.post('/admin/assign-subject', payload);
            setMessage({ type: 'success', text: 'Subject assigned successfully!' });
            setSubjectForm({ ...subjectForm, subjectId: '', teacherId: '' }); // keep dept/class
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to assign subject' });
        } finally {
            setLoading(false);
        }
    };

    const handleCoordinatorSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.post('/admin/assign-class-coordinator', coordinatorForm);
            setMessage({ type: 'success', text: 'Class Coordinator appointed successfully!' });
            setCoordinatorForm({ ...coordinatorForm, teacherId: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to appoint coordinator' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>

            {/* Header */}
            <header style={{ marginBottom: '3rem', position: 'relative' }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Academic <span style={{ color: 'var(--brand-primary)' }}>Assignments</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6' }}>
                        Architect your institution's schedule by seamlessly allocating subjects to faculty and classes.
                    </p>
                </motion.div>

                {/* Decorative background glow */}
                <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '200px', height: '200px', background: 'var(--brand-primary)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />
            </header>

            {/* Navigation Pill */}
            <div style={{
                display: 'inline-flex',
                background: 'var(--bg-secondary)',
                padding: '0.4rem',
                borderRadius: '1rem',
                border: '1px solid var(--border-color)',
                marginBottom: '3rem',
                position: 'relative'
            }}>
                {[
                    { id: 'subject', label: 'Assign Subjects', icon: <BookOpen size={18} /> },
                    { id: 'coordinator', label: 'Appoint Coordinators', icon: <UserCheck size={18} /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setMessage({ type: '', text: '' }); }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            border: 'none',
                            background: 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            position: 'relative',
                            zIndex: 1,
                            transition: 'color 0.3s'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                                    borderRadius: '0.75rem',
                                    zIndex: -1,
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                }}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {fetchError && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {fetchError}
                </div>
            )}

            {/* Notification */}
            <AnimatePresence>
                {message.text && (
                    <motion.div
                        key="notification"
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        style={{
                            padding: '1.2rem 1.5rem',
                            marginBottom: '2rem',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#ef4444',
                            border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            backdropFilter: 'blur(10px)',
                            fontWeight: '600',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <div style={{
                            background: message.type === 'success' ? '#10b981' : '#ef4444',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                        </div>
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'subject' ? (
                        <motion.div
                            key="subject-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="glass-panel"
                            style={{
                                padding: '2.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
                            }}
                        >
                            <form onSubmit={handleSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                {/* Section 1: Basic Info */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <FormGroup label="Department" icon={<Building2 size={16} />}>
                                        <select
                                            className="form-input" required
                                            value={subjectForm.departmentId}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value, classId: '' })}
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.8rem 1rem' }}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                        </select>
                                    </FormGroup>

                                    <FormGroup label="Class & Section" icon={<LayoutGrid size={16} />}>
                                        <select
                                            className="form-input" required disabled={!subjectForm.departmentId}
                                            value={subjectForm.classId}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })}
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.8rem 1rem' }}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                        </select>
                                    </FormGroup>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                                    <FormGroup label="Subject Name" icon={<BookOpen size={16} />}>
                                        <select
                                            className="form-input" required disabled={!subjectForm.departmentId}
                                            value={subjectForm.subjectId}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, subjectId: e.target.value })}
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.8rem 1rem' }}
                                        >
                                            <option value="">Select Subject</option>
                                            {subjects.filter(s => s.departmentId === subjectForm.departmentId || s.departmentId?._id === subjectForm.departmentId).map(s => (
                                                <option key={s._id} value={s._id}>{s.subjectName}</option>
                                            ))}
                                        </select>
                                    </FormGroup>
                                    <FormGroup label="Room No." icon={<MapPin size={16} />}>
                                        <input
                                            type="text" className="form-input" placeholder="e.g. Hall 402"
                                            value={subjectForm.roomNumber}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, roomNumber: e.target.value })}
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.8rem 1rem' }}
                                        />
                                    </FormGroup>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                                {/* Section 2: Schedule Picker */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                                        <Calendar size={18} color="var(--brand-primary)" /> Weekly Schedule Selection
                                    </label>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {/* Day Row */}
                                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                            {DAYS.map(day => (
                                                <motion.button
                                                    key={day}
                                                    type="button"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => {
                                                        setSelectedDay(day);
                                                        const time = selectedTime ? ` - ${selectedTime}` : '';
                                                        setSubjectForm({ ...subjectForm, timeSlot: `${day}${time}` });
                                                    }}
                                                    style={{
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid',
                                                        borderColor: selectedDay === day ? 'var(--brand-primary)' : 'var(--border-color)',
                                                        background: selectedDay === day ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-primary)',
                                                        color: selectedDay === day ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s'
                                                    }}
                                                >
                                                    {day.substring(0, 3)}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Time Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                            {TIMES.map(time => (
                                                <motion.button
                                                    key={time}
                                                    type="button"
                                                    whileHover={{ y: -2 }}
                                                    onClick={() => {
                                                        setSelectedTime(time);
                                                        const day = selectedDay || 'Select Day';
                                                        setSubjectForm({ ...subjectForm, timeSlot: `${day} ${time}` });
                                                    }}
                                                    style={{
                                                        padding: '1rem',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid',
                                                        borderColor: selectedTime === time ? 'var(--brand-primary)' : 'var(--border-color)',
                                                        background: selectedTime === time ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-primary)',
                                                        color: selectedTime === time ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                                        fontWeight: '500',
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    <Clock size={14} opacity={selectedTime === time ? 1 : 0.5} />
                                                    {time}
                                                </motion.button>
                                            ))}
                                        </div>

                                        {/* Selection Summary */}
                                        <AnimatePresence>
                                            {subjectForm.timeSlot && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{
                                                        padding: '1rem 1.5rem',
                                                        background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
                                                        borderRadius: '0.75rem',
                                                        color: 'white',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        boxShadow: '0 10px 20px rgba(79, 70, 229, 0.2)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: '500' }}>SELECTED TIME SLOT</div>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{subjectForm.timeSlot}</div>
                                                        </div>
                                                    </div>
                                                    <Check size={24} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                                {/* Section 3: Teacher Assignment */}
                                <FormGroup label="Faculty Assignment" icon={<UserCheck size={16} />}>
                                    <select
                                        className="form-input" required
                                        value={subjectForm.teacherId}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '0.8rem 1rem' }}
                                    >
                                        <option value="">Select Faculty Member</option>
                                        {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                                    </select>
                                </FormGroup>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: '1.2rem',
                                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                                        color: 'white',
                                        borderRadius: '1rem',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '800',
                                        fontSize: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.8rem',
                                        marginTop: '1rem',
                                        boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)'
                                    }}
                                >
                                    {loading ? 'Processing Allocation...' : <><Plus size={22} /> Assign Subject</>}
                                </motion.button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="coordinator-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="glass-panel"
                            style={{
                                padding: '3rem',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <form onSubmit={handleCoordinatorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <FormGroup label="Department" icon={<Building2 size={16} />}>
                                        <select
                                            className="form-input" required
                                            value={coordinatorForm.departmentId}
                                            onChange={(e) => setCoordinatorForm({ ...coordinatorForm, departmentId: e.target.value, classId: '' })}
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem' }}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                        </select>
                                    </FormGroup>

                                    <FormGroup label="Class & Section" icon={<LayoutGrid size={16} />}>
                                        <select
                                            className="form-input" required disabled={!coordinatorForm.departmentId}
                                            value={coordinatorForm.classId}
                                            onChange={(e) => setCoordinatorForm({ ...coordinatorForm, classId: e.target.value })}
                                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem' }}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                        </select>
                                    </FormGroup>
                                </div>

                                <FormGroup label="Appoint Faculty" icon={<UserCheck size={16} />}>
                                    <select
                                        className="form-input" required
                                        value={coordinatorForm.teacherId}
                                        onChange={(e) => setCoordinatorForm({ ...coordinatorForm, teacherId: e.target.value })}
                                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1rem' }}
                                    >
                                        <option value="">Select Faculty Member</option>
                                        {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                                    </select>
                                </FormGroup>

                                <motion.div
                                    style={{
                                        padding: '1.5rem',
                                        background: 'rgba(245, 158, 11, 0.05)',
                                        borderRadius: '1rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                        lineHeight: '1.6'
                                    }}
                                >
                                    <strong style={{ color: 'var(--warning)', display: 'block', marginBottom: '0.3rem' }}>Elevated Privileges</strong>
                                    Appointing a Class Coordinator grants this faculty member the authority to oversee leaf approvals, monitor class-wide attendance, and manage student performance metrics.
                                </motion.div>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        padding: '1.2rem',
                                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                                        color: 'white',
                                        borderRadius: '1rem',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: '800',
                                        fontSize: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.8rem',
                                        boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)'
                                    }}
                                >
                                    {loading ? 'Appointing...' : <><UserCheck size={22} /> Appoint Coordinator</>}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Global Styles for custom selects and transitions */}
            <style>{`
                .form-input:focus {
                    border-color: var(--brand-primary) !important;
                    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
                    outline: none;
                }
                select.form-input {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                    background-size: 1.2rem;
                }
            `}</style>
        </div>
    );
};

// Internal components for layout
const FormGroup = ({ label, icon, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--text-secondary)'
        }}>
            <span style={{ color: 'var(--brand-primary)', opacity: 0.8 }}>{icon}</span> {label}
        </label>
        {children}
    </div>
);

export default Assignments;
