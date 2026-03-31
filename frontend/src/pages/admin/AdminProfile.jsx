import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Image, CheckCircle, AlertCircle, Save, Edit2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import adminAvatar from '../../assets/admin_avatar.png';
import adminCover from '../../assets/admin_cover.png';

const AdminProfile = () => {
    const { fetchUserProfile } = useAuth();
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isEditMode, setIsEditMode] = useState(false);

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatar: '',
        coverImage: ''
    });

    const [universityEmail, setUniversityEmail] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, settingsRes] = await Promise.all([
                    axios.get('/admin/profile'),
                    axios.get('/admin/settings')
                ]);

                setUser(profileRes.data);
                setProfileForm({
                    name: profileRes.data.name,
                    email: profileRes.data.email,
                    password: '',
                    confirmPassword: '',
                    avatar: adminAvatar,
                    coverImage: adminCover
                });

                const emailSetting = settingsRes.data.find(s => s.key === 'universityEmail');
                if (emailSetting) setUniversityEmail(emailSetting.value);
                setSettings(settingsRes.data);
            } catch (err) {
                console.error('Failed to fetch profile or settings', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        try {
            const { data } = await axios.put('/admin/profile', profileForm);
            setUser(data);
            setProfileForm(prev => ({
                ...prev,
                name: data.name,
                email: data.email,
                avatar: data.avatar || '',
                coverImage: data.coverImage || '',
                password: '',
                confirmPassword: ''
            }));
            setMessage({ type: 'success', text: 'Profile updated successfully' });

            // To ensure global UI updates (Header/Sidebar), we can trigger a refresh 
            // of the AuthContext if it's available. Though refresh on page reload 
            // is handled byfetchUserProfile in AuthContext.

            setIsEditMode(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        }
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/admin/settings', {
                settings: [{ key: 'universityEmail', value: universityEmail }]
            });
            setMessage({ type: 'success', text: 'Settings updated successfully' });
            setIsEditMode(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update settings' });
        }
    };

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileForm(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="p-8">Loading profile...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ overflow: 'hidden', marginBottom: '2rem', position: 'relative' }}
            >
                {/* Edit Mode Toggle */}
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`btn ${isEditMode ? 'btn-secondary' : 'btn-primary'}`}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 20,
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem'
                    }}
                >
                    {isEditMode ? <><X size={16} /> Cancel Edit</> : <><Edit2 size={16} /> Edit Profile</>}
                </button>
                {/* Cover Image */}
                <div style={{
                    height: '200px',
                    background: `url(${adminCover}) center/cover`,
                    position: 'relative'
                }}>
                </div>

                {/* Profile Header */}
                <div style={{ padding: '0 2rem 2rem', marginTop: '-3rem', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '24px',
                                border: '4px solid var(--bg-primary)', background: 'var(--bg-secondary)',
                                overflow: 'hidden'
                            }}>
                                <img src={adminAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>
                        <div style={{ paddingBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user?.name}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>System Administrator</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                {/* Profile Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel"
                    style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}
                >
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} className="text-brand" /> Profile Information
                    </h3>
                    <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '3rem', opacity: isEditMode ? 1 : 0.7 }}
                                    value={profileForm.name}
                                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    required
                                    disabled={!isEditMode}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                <input
                                    className="input-field"
                                    style={{ paddingLeft: '3rem', opacity: isEditMode ? 1 : 0.7 }}
                                    type="email"
                                    value={profileForm.email}
                                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                    placeholder="admin@example.com"
                                    required
                                    disabled={!isEditMode}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: '3rem', opacity: isEditMode ? 1 : 0.7 }}
                                        type="password"
                                        value={profileForm.password}
                                        onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                                        placeholder="Min 6 chars"
                                        disabled={!isEditMode}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: '3rem', opacity: isEditMode ? 1 : 0.7 }}
                                        type="password"
                                        value={profileForm.confirmPassword}
                                        onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                                        placeholder="Repeat new password"
                                        disabled={!isEditMode}
                                    />
                                </div>
                            </div>
                        </div>
                        {isEditMode && (
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                <Save size={18} /> Save Profile Changes
                            </button>
                        )}
                    </form>
                </motion.div>

                {/* University Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel"
                        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}
                    >
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={20} className="text-brand" /> University Configuration
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            This email is used as the universal sender for all student and teacher notifications.
                            It defaults to the email configured in your environment system.
                        </p>
                        <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                            <div className="form-group">
                                <label className="form-label">University Email ID</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: '3rem', opacity: isEditMode ? 1 : 0.7 }}
                                        type="email"
                                        value={universityEmail}
                                        onChange={e => setUniversityEmail(e.target.value)}
                                        placeholder="university.admin@mail.com"
                                        required
                                        disabled={!isEditMode}
                                    />
                                </div>
                            </div>
                            {isEditMode && (
                                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                    <button type="submit" className="btn btn-outline" style={{ width: '100%', padding: '0.875rem' }}>
                                        <Save size={18} /> Update Settings
                                    </button>
                                </div>
                            )}
                        </form>
                    </motion.div>

                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: message.type === 'success' ? '#166534' : '#991b1b',
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                            }}
                        >
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            {message.text}
                        </motion.div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AdminProfile;
