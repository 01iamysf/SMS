import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

const AcademicManage = () => {
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);

    const [newDept, setNewDept] = useState('');
    const [newClass, setNewClass] = useState({ className: '', departmentId: '', year: new Date().getFullYear() });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [deptRes, classRes] = await Promise.all([
                axios.get('/admin/departments'),
                axios.get('/admin/classes')
            ]);
            setDepartments(deptRes.data);
            setClasses(classRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/admin/create-department', { departmentName: newDept });
            setNewDept('');
            fetchData();
        } catch (err) {
            alert('Error creating department: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/admin/create-class', newClass);
            setNewClass({ className: '', departmentId: '', year: new Date().getFullYear() });
            fetchData();
        } catch (err) {
            alert('Error creating class: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteDept = async (id, name) => {
        if (!window.confirm(`Warning: Deleting the "${name}" department will also delete all subjects and allocations within it. Proceed?`)) return;
        try {
            await axios.delete(`/admin/department/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting department: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteClass = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete class "${name}"? All associated subject allocations for this class will be removed.`)) return;
        try {
            await axios.delete(`/admin/class/${id}`);
            fetchData();
        } catch (err) {
            alert('Error deleting class: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Departments Section */}
            <motion.div className="glass-panel" style={{ padding: '2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--brand-primary)' }}>Departments</h2>

                <form onSubmit={handleCreateDept} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="New Department Name"
                        value={newDept}
                        onChange={e => setNewDept(e.target.value)}
                        required
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary"><Plus size={18} /> Add</button>
                </form>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {departments.map((dept) => (
                        <div key={dept._id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500' }}>{dept.departmentName}</span>
                            <button
                                onClick={() => handleDeleteDept(dept._id, dept.departmentName)}
                                style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Classes Section */}
            <motion.div className="glass-panel" style={{ padding: '2rem' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--brand-secondary)' }}>Classes</h2>

                <form onSubmit={handleCreateClass} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Class Name (e.g. CS101-A)</label>
                        <input type="text" className="input-field" value={newClass.className} onChange={e => setNewClass({ ...newClass, className: e.target.value })} required placeholder="Name & Section" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Department</label>
                        <select className="input-field" value={newClass.departmentId} onChange={e => setNewClass({ ...newClass, departmentId: e.target.value })} required>
                            <option value="">Select Dept</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Year</label>
                        <input type="number" className="input-field" value={newClass.year} onChange={e => setNewClass({ ...newClass, year: parseInt(e.target.value) })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}><Plus size={18} /> Add Class</button>
                </form>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '0.75rem' }}>Class Name</th>
                                <th style={{ padding: '0.75rem' }}>Department</th>
                                <th style={{ padding: '0.75rem' }}>Year</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map((c) => (
                                <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{c.className}</td>
                                    <td style={{ padding: '0.75rem' }}>{c.departmentId?.departmentName || 'N/A'}</td>
                                    <td style={{ padding: '0.75rem' }}>{c.year}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDeleteClass(c._id, c.className)}
                                            style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {classes.length === 0 && (
                                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>No classes found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

        </div >
    );
};

export default AcademicManage;
