import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, User, Check, X, Search, Filter, AlertCircle, Save, Layers, UserCheck } from 'lucide-react';

const ALL_PERMISSIONS = [
    { id: 'markAttendance', label: 'Mark Attendance', category: 'General' },
    { id: 'manualAttendance', label: 'Manual Attendance', category: 'General' },
    { id: 'viewAttendance', label: 'View Attendance', category: 'General' },
    { id: 'editAttendance', label: 'Edit Attendance', category: 'Security' },
    { id: 'deleteAttendance', label: 'Delete Attendance', category: 'Security' },
    { id: 'exportAttendance', label: 'Export Data', category: 'General' },
    { id: 'bypassTimeRestraint', label: 'Bypass Time Limits', category: 'Security' },
    { id: 'applyLeave', label: 'Apply Leave', category: 'General' },
    { id: 'viewReports', label: 'View Reports', category: 'General' },
    { id: 'manageStudents', label: 'Manage Students', category: 'Management' },
    { id: 'manageSystem', label: 'Manage System', category: 'Management' }
];

const Permissions = () => {
    const [activeTab, setActiveTab] = useState('individual'); // 'individual' or 'bulk'
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Individual State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [individualPerms, setIndividualPerms] = useState([]);

    // Bulk State
    const [departments, setDepartments] = useState([]);
    const [bulkConfig, setBulkConfig] = useState({
        department: '',
        role: 'teacher',
        permissions: []
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get('/admin/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setErrorMsg('');
        try {
            // Reusing student/teacher search pattern but combining or searching both
            const [students, teachers, parents] = await Promise.all([
                axios.get('/admin/students'),
                axios.get('/admin/teachers'),
                axios.get('/admin/parents')
            ]);

            const combined = [...students.data, ...teachers.data, ...parents.data].filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setSearchResults(combined);
        } catch (err) {
            setErrorMsg('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const selectUser = (user) => {
        setSelectedUser(user);
        setIndividualPerms(user.permissions || []);
        setErrorMsg('');
        setSuccessMsg('');
    };

    const togglePermission = (permId, isBulk = false) => {
        if (isBulk) {
            setBulkConfig(prev => ({
                ...prev,
                permissions: prev.permissions.includes(permId)
                    ? prev.permissions.filter(p => p !== permId)
                    : [...prev.permissions, permId]
            }));
        } else {
            setIndividualPerms(prev =>
                prev.includes(permId)
                    ? prev.filter(p => p !== permId)
                    : [...prev, permId]
            );
        }
    };

    const saveIndividualPermissions = async () => {
        if (!selectedUser) return;
        setSaveLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await axios.put(`/admin/user/${selectedUser._id}/permissions`, {
                permissions: individualPerms
            });
            setSuccessMsg(`Permissions updated for ${selectedUser.name}`);
            // Update the local state in search results too
            setSearchResults(prev => prev.map(u => u._id === selectedUser._id ? { ...u, permissions: individualPerms } : u));
        } catch (err) {
            setErrorMsg('Failed to update permissions');
        } finally {
            setSaveLoading(false);
        }
    };

    const applyBulkPermissions = async () => {
        if (!bulkConfig.role) return;
        setSaveLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await axios.post('/admin/assign-permissions', bulkConfig);
            setSuccessMsg('Bulk permissions applied successfully');
        } catch (err) {
            setErrorMsg('Failed to apply bulk permissions');
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield className="text-brand-secondary" size={28} /> Access Control
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage system rights and security tokens</p>
                </div>

                <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', borderRadius: '0.75rem', position: 'relative' }}>
                    {[
                        { id: 'individual', label: 'Individual', icon: <User size={16} /> },
                        { id: 'bulk', label: 'Bulk Update', icon: <Layers size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setErrorMsg(''); setSuccessMsg(''); }}
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                padding: '0.6rem 1.2rem',
                                borderRadius: 10,
                                border: 'none',
                                background: 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                fontWeight: activeTab === tab.id ? '700' : '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'color 0.3s ease'
                            }}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="permissionsTab"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                                        borderRadius: 10,
                                        zIndex: -1,
                                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                    }}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'individual' ? (
                    <motion.div
                        key="individual"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}
                    >
                        {/* Search Sidebar */}
                        <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Search User</h3>
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Name or Email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="input-field"
                                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                                />
                                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <button
                                    onClick={handleSearch}
                                    style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'var(--brand-primary)',
                                        border: 'none',
                                        color: 'white',
                                        padding: '0.3rem 0.6rem',
                                        borderRadius: '0.4rem',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Go
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '1rem' }}><div className="loading-spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }}></div></div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => (
                                        <div
                                            key={user._id}
                                            onClick={() => selectUser(user)}
                                            style={{
                                                padding: '1rem',
                                                background: selectedUser?._id === user._id ? 'var(--brand-primary)10' : 'var(--bg-secondary)',
                                                borderRadius: '0.75rem',
                                                border: `1px solid ${selectedUser?._id === user._id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.role.toUpperCase()} | {user.email}</div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', padding: '1rem' }}>No users found</p>
                                )}
                            </div>
                        </div>

                        {/* Permissions Editor */}
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            {selectedUser ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <UserCheck size={20} className="text-brand-primary" />
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{selectedUser.name}</h3>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Managing permissions for {selectedUser.email}</p>
                                        </div>
                                        <button
                                            disabled={saveLoading}
                                            onClick={saveIndividualPermissions}
                                            className="btn btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            {saveLoading ? <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div> : <Save size={18} />}
                                            Save Changes
                                        </button>
                                    </div>

                                    {successMsg && <div style={{ background: 'var(--success)10', color: 'var(--success)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={18} /> {successMsg}</div>}
                                    {errorMsg && <div style={{ background: 'var(--danger)10', color: 'var(--danger)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> {errorMsg}</div>}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                                        {ALL_PERMISSIONS.map(perm => (
                                            <div
                                                key={perm.id}
                                                onClick={() => togglePermission(perm.id)}
                                                style={{
                                                    padding: '1rem',
                                                    borderRadius: '0.75rem',
                                                    border: '1px solid var(--border-color)',
                                                    background: individualPerms.includes(perm.id) ? 'var(--brand-secondary)10' : 'transparent',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '4px',
                                                    border: '2px solid var(--border-color)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: individualPerms.includes(perm.id) ? 'var(--brand-secondary)' : 'transparent',
                                                    borderColor: individualPerms.includes(perm.id) ? 'var(--brand-secondary)' : 'var(--border-color)'
                                                }}>
                                                    {individualPerms.includes(perm.id) && <Check size={14} color="white" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{perm.label}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>{perm.category}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-light)' }}>
                                    <User size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p>Select a user from the sidebar to manage their permissions</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="bulk"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-panel"
                        style={{ padding: '2.5rem' }}
                    >
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center' }}>Bulk Permission Update</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--brand-primary)' }}>1. TARGET DEPARTMENT (OPTIONAL)</label>
                                    <select
                                        value={bulkConfig.department}
                                        onChange={(e) => setBulkConfig({ ...bulkConfig, department: e.target.value })}
                                        className="input-field"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Apply to all Departments</option>
                                        {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--brand-primary)' }}>2. TARGET ROLE</label>
                                    <select
                                        value={bulkConfig.role}
                                        onChange={(e) => setBulkConfig({ ...bulkConfig, role: e.target.value })}
                                        className="input-field"
                                        style={{ width: '100%' }}
                                    >
                                        <option value="teacher">All Teachers</option>
                                        <option value="student">All Students</option>
                                        <option value="parent">All Parents</option>
                                    </select>
                                </div>
                            </div>

                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--brand-secondary)' }}>3. SELECT PERMISSIONS TO ASSIGN</label>

                            {successMsg && <div style={{ background: 'var(--success)10', color: 'var(--success)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={18} /> {successMsg}</div>}
                            {errorMsg && <div style={{ background: 'var(--danger)10', color: 'var(--danger)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> {errorMsg}</div>}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                                {ALL_PERMISSIONS.map(perm => (
                                    <div
                                        key={perm.id}
                                        onClick={() => togglePermission(perm.id, true)}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '1rem',
                                            border: '1px solid var(--border-color)',
                                            background: bulkConfig.permissions.includes(perm.id) ? 'var(--brand-secondary)10' : 'var(--bg-secondary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            border: '2px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: bulkConfig.permissions.includes(perm.id) ? 'var(--brand-secondary)' : 'white',
                                            borderColor: bulkConfig.permissions.includes(perm.id) ? 'var(--brand-secondary)' : 'var(--border-color)'
                                        }}>
                                            {bulkConfig.permissions.includes(perm.id) && <Check size={16} color="white" />}
                                        </div>
                                        <span>{perm.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '1rem 3rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                    onClick={applyBulkPermissions}
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div> : <Layers size={20} />}
                                    Apply Bulk Update
                                </button>
                            </div>
                            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                                Warning: This will overwrite existing permissions for all users in the selected scope.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .loading-spinner { border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Permissions;
