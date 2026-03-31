import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BookOpen, Plus, Trash2, Edit2, Search, ChevronRight, ArrowLeft, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const SubjectManage = () => {
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Navigation & Filters
    const [selectedDeptId, setSelectedDeptId] = useState(null); // Track drill-down
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        _id: null,
        subjectName: '',
        departmentId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, deptRes] = await Promise.all([
                axios.get('/admin/subjects'),
                axios.get('/admin/departments')
            ]);
            setSubjects(subRes.data);
            setDepartments(deptRes.data);
        } catch (error) {
            console.error('Error fetching subject management data:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Group subjects by department
     */
    const departmentStats = useMemo(() => {
        const stats = {};
        departments.forEach(dept => {
            stats[dept._id] = {
                ...dept,
                subjectCount: subjects.filter(s => (s.departmentId?._id || s.departmentId) === dept._id).length
            };
        });
        return Object.values(stats);
    }, [subjects, departments]);

    const activeDept = useMemo(() =>
        departments.find(d => d._id === selectedDeptId),
        [departments, selectedDeptId]);

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

    const filteredSubjects = useMemo(() => {
        return subjects.filter(s => {
            const matchDept = selectedDeptId ? ((s.departmentId?._id || s.departmentId) === selectedDeptId) : true;
            const matchSearch = searchTerm ? (s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())) : true;
            return matchDept && matchSearch;
        });
    }, [subjects, selectedDeptId, searchTerm]);

    const handleOpenModal = (subject = null) => {
        if (subject) {
            setIsEditing(true);
            setForm({
                _id: subject._id,
                subjectName: subject.subjectName,
                departmentId: subject.departmentId?._id || subject.departmentId
            });
        } else {
            setIsEditing(false);
            setForm({
                _id: null,
                subjectName: '',
                departmentId: selectedDeptId || ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`/admin/subjects/${form._id}`, form);
            } else {
                await axios.post('/admin/subjects', form);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save subject:', error);
            alert(error.response?.data?.message || 'Failed to save subject');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject? It will be removed from all enrolled students and class allocations.')) return;
        try {
            await axios.delete(`/admin/subjects/${id}`);
            fetchData();
        } catch (error) {
            console.error('Failed to delete subject:', error);
            alert(error.response?.data?.message || 'Failed to delete subject');
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {selectedDeptId && (
                        <button
                            onClick={() => setSelectedDeptId(null)}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem', borderRadius: '50%', minWidth: '40px', height: '40px', border: 'none', background: 'var(--bg-secondary)' }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <BookOpen className="text-brand-primary" size={28} />
                            {selectedDeptId ? activeDept?.departmentName : 'Manage Subjects'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {selectedDeptId
                                ? `Showing all subjects under ${activeDept?.departmentName} department.`
                                : 'Select a department to manage its curriculum.'}
                        </p>
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Create Subject
                </button>
            </div>

            {/* Search Bar within detailed view */}
            {selectedDeptId && (
                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search subjects..."
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                    <div className="loader" style={{ margin: '0 auto 1.5rem auto' }}></div>
                    Crunching curriculum data...
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {!selectedDeptId ? (
                        /* INITIAL VIEW: Department Cards */
                        <motion.div
                            key="dept-list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}
                        >
                            {departmentStats.map(dept => (
                                <div
                                    key={dept._id}
                                    className="glass-panel hover-card"
                                    style={{ padding: '1.75rem', cursor: 'pointer', transition: 'all 0.3s' }}
                                    onClick={() => setSelectedDeptId(dept._id)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ background: 'var(--brand-primary-light)', padding: '0.75rem', borderRadius: '12px', color: 'var(--brand-primary)' }}>
                                            <Layers size={24} />
                                        </div>
                                        <ChevronRight size={20} style={{ color: 'var(--text-light)' }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                        {dept.departmentName}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <BookOpen size={14} />
                                        <span>{dept.subjectCount} Subjects</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        /* DETAILED VIEW: Subjects in Department */
                        <motion.div
                            key="subject-list"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {filteredSubjects.map(subject => (
                                    <div key={subject._id} className="glass-panel hover-card" style={{ padding: '1.5rem', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, paddingRight: '1rem' }}>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--brand-primary)', marginBottom: '0.25rem', lineHeight: '1.3' }}>
                                                    {subject.subjectName}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                                                        {activeDept?.departmentName}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(subject); }}
                                                    className="action-btn"
                                                    title="Edit Subject"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(subject._id); }}
                                                    className="action-btn danger"
                                                    title="Delete Subject"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredSubjects.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px dashed var(--border-color)' }}>
                                    <BookOpen size={48} style={{ margin: '0 auto 1.25rem auto', color: 'var(--text-light)', opacity: 0.5 }} />
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No Subjects Found</h3>
                                    <p style={{ color: 'var(--text-light)' }}>There are no subjects listed in this department yet.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Create/Edit Modal via Portal */
                createPortal(
                    <AnimatePresence>
                        {showModal && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 100000,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'auto',
                                padding: '1rem'
                            }}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        padding: '2rem',
                                        width: '100%',
                                        maxWidth: '400px',
                                        borderRadius: '24px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                        border: '1px solid var(--border-color)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px', background: 'var(--brand-primary-light)',
                                            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 0.75rem auto', color: 'var(--brand-primary)',
                                            boxShadow: '0 8px 16px rgba(67, 56, 186, 0.15)'
                                        }}>
                                            <BookOpen size={22} />
                                        </div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                            {isEditing ? 'Edit Subject' : 'New Subject'}
                                        </h2>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            {isEditing ? 'Update module details' : 'Configure new module'}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Subject Name *</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                required
                                                value={form.subjectName}
                                                onChange={e => setForm({ ...form, subjectName: e.target.value })}
                                                placeholder="e.g. Mobile Development"
                                                style={{ height: '42px', fontSize: '0.9rem', padding: '0 1rem' }}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.4rem' }}>Department *</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={form.departmentId}
                                                onChange={e => setForm({ ...form, departmentId: e.target.value })}
                                                style={{ height: '42px', fontSize: '0.9rem', padding: '0 1rem' }}
                                            >
                                                <option value="">Choose dept</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                            </select>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="btn btn-secondary"
                                                style={{ flex: 1, height: '44px', fontSize: '0.9rem' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                style={{ flex: 2, height: '44px', fontSize: '0.9rem' }}
                                            >
                                                {isEditing ? 'Update' : 'Create'}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </div>
    );
};

export default SubjectManage;
