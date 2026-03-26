import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, Plus, Download, Users, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import UserProfileView from '../../components/UserProfileView';

const UserManage = () => {
    const [activeTab, setActiveTab] = useState('students'); // 'manual', 'csv', 'students', 'teachers'
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);

    // Directory State
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [parents, setParents] = useState([]);
    const [filterDept, setFilterDept] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);

    // Manual Form State
    const [manualForm, setManualForm] = useState({
        name: '', email: '', password: '', role: 'student', departmentId: '', classId: '', rollNumber: '', parentEmail: ''
    });

    // CSV State
    const [csvFile, setCsvFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    useEffect(() => {
        fetchDepartmentsAndClasses();
    }, []);

    const fetchDepartmentsAndClasses = async () => {
        try {
            const [deptRes, classRes] = await Promise.all([
                axios.get('/admin/departments'),
                axios.get('/admin/classes')
            ]);
            setDepartments(deptRes.data);
            setClasses(classRes.data);
        } catch (err) {
            console.error('Failed to fetch departments/classes', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'students') fetchStudents();
        if (activeTab === 'teachers') fetchTeachers();
        if (activeTab === 'parents') fetchParents();
    }, [activeTab, filterDept, filterClass]);

    const fetchStudents = async () => {
        try {
            const res = await axios.get('/admin/students', { params: { classId: filterClass || undefined } });
            // Client side filter for department if class is not selected
            let data = res.data;
            if (filterDept && !filterClass) {
                data = data.filter(s => s.departmentId?._id === filterDept || s.departmentId === filterDept);
            }
            setStudents(data);
        } catch (err) {
            console.error('Failed to fetch students', err);
        }
    };

    const fetchTeachers = async () => {
        try {
            const res = await axios.get('/admin/teachers', { params: { departmentId: filterDept || undefined } });
            setTeachers(res.data);
        } catch (err) {
            console.error('Failed to fetch teachers', err);
        }
    };

    const fetchParents = async () => {
        try {
            const res = await axios.get('/admin/parents');
            setParents(res.data);
        } catch (err) {
            console.error('Failed to fetch parents', err);
        }
    };
    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to permanently delete the ${user.role} "${user.name}"? This action cannot be undone.`)) return;

        try {
            await axios.delete(`/admin/user/${user._id}`);
            alert('User deleted successfully');

            // Refresh the current list
            if (activeTab === 'students') fetchStudents();
            if (activeTab === 'teachers') fetchTeachers();
            if (activeTab === 'parents') fetchParents();
        } catch (err) {
            console.error('Failed to delete user', err);
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    // --- Manual Entry Logic ---
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '/admin/create-student';
            if (manualForm.role === 'teacher') endpoint = '/admin/create-teacher';
            if (manualForm.role === 'parent') endpoint = '/admin/update-user/new'; // Or any multi-purpose endpoint, but createUser handles it

            // Clean up payload to avoid empty string CastErrors for ObjectIds
            const payload = { ...manualForm };
            if (!payload.departmentId) delete payload.departmentId;
            if (!payload.classId) delete payload.classId;
            if (!payload.rollNumber) delete payload.rollNumber;

            await axios.post('/admin/create-user', payload);
            alert(`Successfully created ${manualForm.role}`);
            setManualForm({ name: '', email: '', password: '', role: 'student', departmentId: '', classId: '', rollNumber: '', parentEmail: '' });
        } catch (err) {
            alert('Error creating user: ' + (err.response?.data?.message || err.message));
        }
    };

    // --- CSV Upload Logic ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCsvFile(file);
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    setCsvHeaders(results.meta.fields || []);
                    setCsvPreview(results.data.slice(0, 5)); // show max 5 rows preview
                }
            });
            setUploadResult(null);
        }
    };

    const handleCsvUpload = async () => {
        if (!csvFile) return alert('Please select a file first.');
        setUploading(true);
        setUploadResult(null);

        Papa.parse(csvFile, {
            header: true,
            skipEmptyLines: true,
            complete: async function (results) {
                try {
                    const response = await axios.post('/admin/create-users-bulk', { users: results.data });
                    setUploadResult({ success: true, message: response.data.message, data: response.data });
                    setCsvFile(null);
                    setCsvPreview([]);
                } catch (err) {
                    setUploadResult({ success: false, message: err.response?.data?.message || err.message, data: err.response?.data });
                } finally {
                    setUploading(false);
                }
            }
        });
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,name,email,password,role,department,className,rollNumber\nJohn Doe,john@example.com,password123,student,Computer Science,CS101-A,101";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter classes based on selected department
    const filteredClasses = classes.filter(c => c.departmentId?._id === manualForm.departmentId || c.departmentId === manualForm.departmentId);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                {selectedUser ? (
                    <UserProfileView user={selectedUser} onBack={() => setSelectedUser(null)} />
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={24} /> User Management
                            </h2>

                            <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
                                <button
                                    onClick={() => setActiveTab('students')}
                                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeTab === 'students' ? 'var(--brand-primary)' : 'transparent', color: activeTab === 'students' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                    <Users size={16} /> Students
                                </button>
                                <button
                                    onClick={() => setActiveTab('teachers')}
                                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeTab === 'teachers' ? 'var(--brand-primary)' : 'transparent', color: activeTab === 'teachers' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                    <Users size={16} /> Teachers
                                </button>
                                <button
                                    onClick={() => setActiveTab('parents')}
                                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeTab === 'parents' ? 'var(--brand-primary)' : 'transparent', color: activeTab === 'parents' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                    <Users size={16} /> Parents
                                </button>
                                <button
                                    onClick={() => setActiveTab('manual')}
                                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeTab === 'manual' ? 'var(--brand-primary)' : 'transparent', color: activeTab === 'manual' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                    <Plus size={16} /> Manual Entry
                                </button>
                                <button
                                    onClick={() => setActiveTab('csv')}
                                    style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activeTab === 'csv' ? 'var(--brand-primary)' : 'transparent', color: activeTab === 'csv' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                    <FileText size={16} /> Bulk Upload
                                </button>
                            </div>
                        </div>

                        {activeTab === 'students' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <select className="input-field" value={filterDept} onChange={e => { setFilterDept(e.target.value); setFilterClass(''); }} style={{ width: '200px' }}>
                                        <option value="">All Departments</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                    </select>
                                    <select className="input-field" value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ width: '200px' }} disabled={!filterDept}>
                                        <option value="">All Classes</option>
                                        {classes.filter(c => c.departmentId?._id === filterDept || c.departmentId === filterDept).map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                    </select>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                <th style={{ padding: '0.75rem' }}>Name</th>
                                                <th style={{ padding: '0.75rem' }}>Email</th>
                                                <th style={{ padding: '0.75rem' }}>Department</th>
                                                <th style={{ padding: '0.75rem' }}>Class</th>
                                                <th style={{ padding: '0.75rem' }}>Roll No</th>
                                                <th style={{ padding: '0.75rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(s => (
                                                <tr key={s._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setSelectedUser(s)}>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{s.name}</td>
                                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{s.email}</td>
                                                    <td style={{ padding: '0.75rem' }}>{s.departmentId?.departmentName || '-'}</td>
                                                    <td style={{ padding: '0.75rem' }}>{s.classId?.className || '-'}</td>
                                                    <td style={{ padding: '0.75rem' }}>{s.rollNumber || '-'}</td>
                                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={(e) => { e.stopPropagation(); setSelectedUser(s); }}>View</button>
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(s); }}
                                                            title="Delete Student"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {students.length === 0 && <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No students found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'teachers' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <select className="input-field" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ width: '200px' }}>
                                        <option value="">All Departments</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                    </select>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                <th style={{ padding: '0.75rem' }}>Name</th>
                                                <th style={{ padding: '0.75rem' }}>Email</th>
                                                <th style={{ padding: '0.75rem' }}>Department</th>
                                                <th style={{ padding: '0.75rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {teachers.map(t => (
                                                <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setSelectedUser(t)}>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{t.name}</td>
                                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{t.email}</td>
                                                    <td style={{ padding: '0.75rem' }}>{t.departmentId?.departmentName || '-'}</td>
                                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={(e) => { e.stopPropagation(); setSelectedUser(t); }}>View</button>
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(t); }}
                                                            title="Delete Teacher"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {teachers.length === 0 && <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No teachers found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'parents' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                                <th style={{ padding: '0.75rem' }}>Name</th>
                                                <th style={{ padding: '0.75rem' }}>Email</th>
                                                <th style={{ padding: '0.75rem' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parents.map(p => (
                                                <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => setSelectedUser(p)}>
                                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{p.name}</td>
                                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{p.email}</td>
                                                    <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={(e) => { e.stopPropagation(); setSelectedUser(p); }}>View</button>
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteUser(p); }}
                                                            title="Delete Parent"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {parents.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No parents found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'manual' && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                <form onSubmit={handleManualSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Role *</label>
                                        <select className="input-field" value={manualForm.role} onChange={e => setManualForm({ ...manualForm, role: e.target.value })} required style={{ width: '100%' }}>
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="parent">Parent</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                                        <input type="text" className="input-field" value={manualForm.name} onChange={e => setManualForm({ ...manualForm, name: e.target.value })} required style={{ width: '100%' }} placeholder="e.g. Jane Doe" />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email Address *</label>
                                        <input type="email" className="input-field" value={manualForm.email} onChange={e => setManualForm({ ...manualForm, email: e.target.value })} required style={{ width: '100%' }} placeholder="jane@example.com" />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Temporary Password *</label>
                                        <input type="password" className="input-field" value={manualForm.password} onChange={e => setManualForm({ ...manualForm, password: e.target.value })} required style={{ width: '100%' }} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Department</label>
                                        <select className="input-field" value={manualForm.departmentId} onChange={e => setManualForm({ ...manualForm, departmentId: e.target.value, classId: '' })} style={{ width: '100%' }}>
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                        </select>
                                    </div>

                                    {manualForm.role === 'student' && (
                                        <>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Class</label>
                                                <select className="input-field" value={manualForm.classId} onChange={e => setManualForm({ ...manualForm, classId: e.target.value })} style={{ width: '100%' }}>
                                                    <option value="">Select Class</option>
                                                    {filteredClasses.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Roll Number</label>
                                                <input type="text" className="input-field" value={manualForm.rollNumber} onChange={e => setManualForm({ ...manualForm, rollNumber: e.target.value })} style={{ width: '100%' }} placeholder="e.g. 1001" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Parent Email</label>
                                                <input type="email" className="input-field" value={manualForm.parentEmail} onChange={e => setManualForm({ ...manualForm, parentEmail: e.target.value })} style={{ width: '100%' }} placeholder="parent@example.com" />
                                            </div>
                                        </>
                                    )}

                                    <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn btn-primary"><Plus size={18} /> Create User</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'csv' && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Upload CSV File</h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Please ensure your CSV matches the required columns.</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button type="button" onClick={downloadTemplate} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Download size={16} /> Template
                                            </button>
                                            <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Upload size={16} /> Browse File
                                                <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                    </div>

                                    {csvFile && (
                                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} color="var(--brand-primary)" /> {csvFile.name}</span>
                                                <button onClick={handleCsvUpload} disabled={uploading} className="btn btn-primary" style={{ height: '36px' }}>
                                                    {uploading ? 'Processing...' : 'Upload Users'}
                                                </button>
                                            </div>

                                            {csvPreview.length > 0 && (
                                                <div style={{ overflowX: 'auto', fontSize: '0.875rem' }}>
                                                    <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Preview (First {csvPreview.length} rows):</p>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                {csvHeaders.map(h => <th key={h} style={{ padding: '0.5rem' }}>{h}</th>)}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {csvPreview.map((row, idx) => (
                                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                    {csvHeaders.map(h => <td key={h} style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>{row[h]}</td>)}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {uploadResult && (
                                        <div style={{
                                            padding: '1rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: uploadResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: uploadResult.success ? '#15803d' : '#b91c1c',
                                            border: `1px solid ${uploadResult.success ? '#22c55e' : '#ef4444'}`,
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem'
                                        }}>
                                            {uploadResult.success ? <CheckCircle size={20} style={{ marginTop: '0.125rem' }} /> : <AlertCircle size={20} style={{ marginTop: '0.125rem' }} />}
                                            <div>
                                                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{uploadResult.message}</p>
                                                {!uploadResult.success && uploadResult.data?.errors && (
                                                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                                        {uploadResult.data.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                                        {uploadResult.data.errors.length > 5 && <li>...and {uploadResult.data.errors.length - 5} more errors.</li>}
                                                    </ul>
                                                )}
                                                {uploadResult.success && uploadResult.data?.errors?.length > 0 && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                                        <p style={{ fontWeight: '500', color: '#b91c1c' }}>Some rows failed to import:</p>
                                                        <ul style={{ marginLeft: '1.5rem', color: '#b91c1c' }}>
                                                            {uploadResult.data.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                                            {uploadResult.data.errors.length > 5 && <li>...and {uploadResult.data.errors.length - 5} more errors.</li>}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default UserManage;
