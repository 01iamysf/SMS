import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, BookOpen, Shield, Activity, Calendar as CalendarIcon, User as UserIcon, Check, X as XIcon, ChevronLeft, ChevronRight, X, Settings } from 'lucide-react';
import axios from 'axios';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns';

const ALL_SYSTEM_PERMISSIONS = [
    { id: 'markAttendance', label: 'Mark Attendance', desc: 'Can mark attendance for classes' },
    { id: 'manualAttendance', label: 'Manual Attendance', desc: 'Can manually overwrite attendance' },
    { id: 'viewAttendance', label: 'View Attendance', desc: 'Can view attendance reports' },
    { id: 'editAttendance', label: 'Edit Attendance', desc: 'Can modify attendance records' },
    { id: 'deleteAttendance', label: 'Delete Attendance', desc: 'Can remove attendance records' },
    { id: 'exportAttendance', label: 'Export Data', desc: 'Can download attendance reports' },
    { id: 'bypassTimeRestraint', label: 'Bypass Time Limits', desc: 'Can mark attendance outside scheduled class hours' },
    { id: 'applyLeave', label: 'Apply Leave', desc: 'Can request leave of absence' },
    { id: 'viewReports', label: 'View Reports', desc: 'Access to high-level analytics' },
    { id: 'manageStudents', label: 'Manage Students', desc: 'Add or modify student records' },
    { id: 'manageSystem', label: 'Manage System', desc: 'Access to system-wide configurations' },
    { id: 'scanQR', label: 'Scan QR', desc: 'Can sign in using QR code' },
    { id: 'generateQR', label: 'Generate QR', desc: 'Can create QR codes for sessions' }
];

/**
 * UserProfileView Component
 * A comprehensive view for displaying and editing user details, permissions, 
 * academic allocations, and attendance history.
 * 
 * @param {Object} props
 * @param {Object} props.user - The user object to view/edit
 * @param {Function} props.onBack - Callback function for going back
 */
const UserProfileView = ({ user, onBack }) => {
    const [profileData, setProfileData] = useState(null);
    const [stats, setStats] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        subjectId: '',
        semester: '',
        year: '',
        classId: '',
        timeSlot: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        roomNumber: ''
    });
    const [editingAllocation, setEditingAllocation] = useState(null);
    const [updatingParams, setUpdatingParams] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // profile, attendance, permissions, settings
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user.name || '',
        email: user.email || '',
        password: '',
        departmentId: user.departmentId?._id || user.departmentId || '',
        classId: user.classId?._id || user.classId || '',
        section: user.section || '',
        rollNumber: user.rollNumber || '',
        parentEmail: user.parentEmail || ''
    });
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [parents, setParents] = useState([]);

    // Calendar State for Attendance Tab
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (user) {
            fetchUserDetails(user._id);
            fetchAcademicData();
        }
    }, [user]);

    // Synchronize editForm when profileData changes (e.g. after fetch or save)
    useEffect(() => {
        if (profileData) {
            setEditForm({
                name: profileData.name || '',
                email: profileData.email || '',
                password: '',
                departmentId: profileData.departmentId?._id || profileData.departmentId || '',
                classId: profileData.classId?._id || profileData.classId || '',
                section: profileData.section || '',
                rollNumber: profileData.rollNumber || '',
                parentEmail: profileData.parentEmail || ''
            });
        }
    }, [profileData]);

    /**
     * Fetch departments and classes for dropdowns
     */
    const fetchAcademicData = async () => {
        try {
            const [deptRes, classRes, subRes, parentRes] = await Promise.all([
                axios.get('/admin/departments'),
                axios.get('/admin/classes'),
                axios.get('/admin/subjects'),
                axios.get('/admin/parents')
            ]);
            setDepartments(deptRes.data);
            setClasses(classRes.data);
            setAllSubjects(subRes.data);
            setParents(parentRes.data);
        } catch (err) {
            console.error('Failed to fetch departments/classes/subjects', err);
        }
    };

    /**
     * Fetch detailed user data (includes stats and history)
     * @param {String} id - User ID
     */
    const fetchUserDetails = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`/admin/user/${id}`);
            setProfileData(res.data.profile);
            setStats(res.data.stats);
            setSubjects(res.data.subjects || []);
        } catch (err) {
            console.error("Error fetching user details", err);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = async (permissionId) => {
        if (updatingParams || !profileData) return;
        setUpdatingParams(true);
        try {
            const currentPerms = profileData.permissions || [];
            const newPerms = currentPerms.includes(permissionId)
                ? currentPerms.filter(p => p !== permissionId)
                : [...currentPerms, permissionId];

            const res = await axios.put(`/admin/user/${user._id}/permissions`, { permissions: newPerms });
            setProfileData(prev => ({ ...prev, permissions: res.data.permissions }));
        } catch (error) {
            console.error("Failed to update permissions", error);
        } finally {
            setUpdatingParams(false);
        }
    };

    const handleEditFormChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    /**
     * Save profile changes to the backend
     */
    const saveChanges = async () => {
        setUpdatingParams(true);
        try {
            const updatePayload = {
                name: editForm.name,
                email: editForm.email,
                departmentId: editForm.departmentId || null,
                classId: editForm.classId || null,
                section: editForm.section,
                rollNumber: editForm.rollNumber,
                parentEmail: editForm.parentEmail || null
            };
            if (editForm.password) {
                updatePayload.password = editForm.password;
            }

            const res = await axios.put(`/admin/update-user/${user._id}`, updatePayload);
            setProfileData(prev => ({ ...prev, ...res.data }));
            setEditMode(false);
            setEditForm(prev => ({ ...prev, password: '' })); // clear password after save
            // Note: Ideally, you'd trigger a parent re-render here to update the user list Name/Email context.
        } catch (error) {
            console.error("Failed to update user profile", error);
            alert("Failed to update user details.");
        } finally {
            setUpdatingParams(false);
        }
    };

    /**
     * Assign a subject/timetable entry to a teacher
     */
    const handleAssignSubject = async (e) => {
        e.preventDefault();
        setUpdatingParams(true);
        try {
            if (profileData.role === 'student') {
                if (editingAllocation) {
                    const res = await axios.put(`/admin/user/${user._id}/subjects/${assignForm.subjectId}`, {
                        semester: assignForm.semester,
                        year: assignForm.year
                    });
                    setProfileData(res.data);
                } else {
                    const res = await axios.post(`/admin/user/${user._id}/subjects`, {
                        subjectId: assignForm.subjectId,
                        semester: assignForm.semester,
                        year: assignForm.year
                    });
                    setProfileData(res.data);
                }
            } else {
                const payload = {
                    subjectId: assignForm.subjectId,
                    teacherId: user._id,
                    classId: assignForm.classId,
                    timeSlot: assignForm.timeSlot,
                    dayOfWeek: assignForm.dayOfWeek,
                    startTime: assignForm.startTime,
                    endTime: assignForm.endTime,
                    roomNumber: assignForm.roomNumber
                };

                if (editingAllocation) {
                    await axios.put(`/admin/assign-subject/${editingAllocation._id}`, payload);
                } else {
                    await axios.post(`/admin/assign-subject`, payload);
                }

                // Refresh list
                const res = await axios.get(`/admin/user/${user._id}`);
                setSubjects(res.data.subjects || []);
            }
            setShowAssignModal(false);
            resetAssignForm();
        } catch (error) {
            console.error('Failed to assign subject', error);
            alert(error.response?.data?.message || 'Failed to assign subject');
        } finally {
            setUpdatingParams(false);
        }
    };

    const handleRemoveAllocation = async (allocationId) => {
        if (!window.confirm('Are you sure you want to remove this allocation?')) return;
        setUpdatingParams(true);
        try {
            await axios.delete(`/admin/assign-subject/${allocationId}`);
            // Refresh list
            const res = await axios.get(`/admin/user/${user._id}`);
            setSubjects(res.data.subjects || []);
            alert('Teacher allocation removed successfully');
        } catch (error) {
            console.error('Failed to remove allocation', error);
            alert('Failed to remove allocation');
        } finally {
            setUpdatingParams(false);
        }
    };

    const resetAssignForm = () => {
        setAssignForm({
            subjectId: '',
            semester: '',
            year: '',
            classId: '',
            timeSlot: '',
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            roomNumber: ''
        });
        setEditingAllocation(null);
    };

    const openEditAllocation = (allocation) => {
        setEditingAllocation(allocation);
        setAssignForm({
            subjectId: allocation.subjectId?._id || allocation.subjectId,
            classId: allocation.classId?._id || allocation.classId,
            timeSlot: allocation.timeSlot || '',
            dayOfWeek: allocation.dayOfWeek || '',
            startTime: allocation.startTime || '',
            endTime: allocation.endTime || '',
            roomNumber: allocation.roomNumber || '',
            semester: '', // irrelevant for teacher
            year: '' // irrelevant for teacher
        });
        setShowAssignModal(true);
    };

    /**
     * Open modal to edit an already enrolled student subject
     */
    const openEditEnrolledSubject = (enrollment) => {
        setEditingAllocation(enrollment); // Reuse this state as an "isEditing" flag
        setAssignForm({
            subjectId: enrollment.subject?._id || enrollment.subject || '',
            semester: enrollment.semester || '',
            year: enrollment.year || '',
            classId: '',
            timeSlot: '',
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            roomNumber: ''
        });
        setShowAssignModal(true);
    };

    const handleRemoveSubject = async (subjectId) => {
        const studentId = profileData?._id || user?._id;

        console.log('DEBUG: handleRemoveSubject called', { studentId, subjectId });

        if (!subjectId) {
            alert('Error: Subject ID is missing. Please refresh and try again.');
            return;
        }
        if (!studentId) {
            alert('Error: Student ID not found. Please refresh and try again.');
            return;
        }

        if (!window.confirm('Are you sure you want to remove this subject from this student?')) return;

        // Immediate feedback
        alert(`Requesting removal of subject ID: ${subjectId}`);

        setUpdatingParams(true);
        try {
            const sid = (typeof subjectId === 'string') ? subjectId.trim() : subjectId;
            const url = `/admin/user/${studentId}/subjects/${sid}`;
            const res = await axios.delete(url);

            if (res.data && res.data._id) {
                setProfileData(res.data);
                alert('Success: Subject removed successfully!');
            } else {
                alert('Warning: Server response did not contain updated user data.');
            }
        } catch (error) {
            console.error('Failed to remove subject:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed: ${msg}`);
        } finally {
            setUpdatingParams(false);
        }
    };

    if (!user) return null;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff&size=200`;

    // Calculate display stats based on calendar filter
    const getStudentDisplayStats = () => {
        if (!stats) return { totalClasses: 0, totalPresent: 0, totalAbsent: 0 };
        if (!selectedDate) return stats;

        const historyOnDate = stats.history?.filter(h => isSameDay(new Date(h.date), selectedDate)) || [];
        return {
            totalClasses: historyOnDate.length > 0 ? 1 : 0,
            totalPresent: historyOnDate.filter(h => h.status === 'present').length,
            totalAbsent: historyOnDate.filter(h => h.status === 'absent').length
        };
    };

    const getTeacherDisplayStats = () => {
        if (!stats) return { totalClassesConducted: 0 };
        if (!selectedDate) return stats;

        const historyOnDate = stats.history?.filter(h => isSameDay(new Date(h.date), selectedDate)) || [];
        return {
            totalClassesConducted: historyOnDate.length
        };
    };

    /**
     * Helper to render the interactive attendance calendar
     */
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrMonth = isSameMonth(day, monthStart);

                // Indicators logic
                const recordsOnDay = stats?.history?.filter(h => isSameDay(new Date(h.date), cloneDay)) || [];
                const hasPresent = recordsOnDay.some(h => h.status === 'present');
                const hasAbsent = recordsOnDay.some(h => h.status === 'absent');
                const hasClass = recordsOnDay.length > 0;

                days.push(
                    <div
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : cloneDay)}
                        style={{
                            flex: 1, height: '40px', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            borderRadius: '0.5rem',
                            background: isSelected ? 'var(--brand-primary)' : 'transparent',
                            color: isSelected ? 'white' : (isCurrMonth ? 'var(--text-primary)' : 'var(--text-light)'),
                            opacity: isCurrMonth ? 1 : 0.4,
                            position: 'relative',
                            transition: 'all 0.2s',
                            border: '1px solid transparent'
                        }}
                        onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-primary)'; }}
                        onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <span style={{ fontSize: '0.875rem', zIndex: 1, fontWeight: isSelected ? 'bold' : 'normal' }}>{formattedDate}</span>
                        {!isSelected && (hasPresent || hasAbsent || hasClass) && (
                            <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px' }}>
                                {profileData?.role === 'student' ? (
                                    <>
                                        {hasPresent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16a34a' }} />}
                                        {hasAbsent && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#dc2626' }} />}
                                    </>
                                ) : (
                                    hasClass && <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                                )}
                            </div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(<div key={day} style={{ display: 'flex', marginTop: '4px' }}>{days}</div>);
            days = [];
        }

        const weekDays = [];
        let weekStartDate = startOfWeek(currentMonth);
        for (let i = 0; i < 7; i++) {
            weekDays.push(
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {format(addDays(weekStartDate, i), 'eeeee')}
                </div>
            );
        }

        return (
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1rem' }}>{format(currentMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div style={{ display: 'flex', marginBottom: '1rem' }}>{weekDays}</div>
                <div>{rows}</div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ width: '100%' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
                <button
                    onClick={onBack}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    User Profile
                </h2>
            </div>

            <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '1rem',
                width: '100%',
                position: 'relative',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                {/* Cover Gradient */}
                <div style={{
                    height: '140px',
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                }} />

                {/* Content Section */}
                <div style={{ padding: '0 clamp(1rem, 5vw, 2rem) 2rem clamp(1rem, 5vw, 2rem)', position: 'relative' }}>

                    {/* Avatar */}
                    <div style={{
                        marginTop: '-50px',
                        marginBottom: '1rem',
                        display: 'flex', justifyContent: 'flex-start'
                    }}>
                        <img src={avatarUrl} alt={user.name} style={{
                            width: '100px', height: '100px', borderRadius: '50%',
                            border: '4px solid var(--bg-primary)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            objectFit: 'cover'
                        }} />
                    </div>

                    {/* Basic Info */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.name}</h2>

                        <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                                fontSize: '0.875rem', fontWeight: '500', textTransform: 'capitalize',
                                background: user.role === 'teacher' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: user.role === 'teacher' ? '#7c3aed' : '#2563eb'
                            }}>
                                {user.role === 'teacher' ? 'Teacher' : 'Student'}
                            </span>
                            {profileData?.classCoordinatorFor && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    padding: '0.25rem 0.75rem', borderRadius: '9999px',
                                    fontSize: '0.875rem', fontWeight: '600',
                                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                                    color: 'white'
                                }}>
                                    ⭐ Class Coordinator
                                </span>
                            )}
                        </div>

                        <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} /> {user.email}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{
                        display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem',
                        overflowX: 'auto', paddingBottom: '1px' // Prevent scrollbar cutting off active border
                    }}>
                        {[
                            { id: 'profile', label: 'Profile', icon: UserIcon },
                            { id: 'attendance', label: 'Attendance', icon: Activity },
                            { id: 'permissions', label: 'Permissions', icon: Shield },
                            ...(profileData?.role === 'student' || profileData?.role === 'teacher' ? [{ id: 'subjects', label: 'Subjects', icon: BookOpen }] : []),
                            { id: 'settings', label: 'Settings', icon: Settings }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                                    color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                    fontWeight: activeTab === tab.id ? '600' : '500',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading details...</div>
                    ) : (
                        <div style={{ minHeight: '300px' }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >

                                    {/* --- PROFILE TAB --- */}
                                    {activeTab === 'profile' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
                                            {/* Academic Information */}
                                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                                    <BookOpen size={18} /> Academic Details
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                                                    <div>
                                                        <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Department</span>
                                                        <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{profileData?.departmentId?.departmentName || 'N/A'}</strong>
                                                    </div>
                                                    {profileData?.role === 'student' && (
                                                        <>
                                                            <div>
                                                                <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Class</span>
                                                                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{profileData?.classId?.className || 'N/A'}</strong>
                                                            </div>
                                                            <div>
                                                                <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Roll Number</span>
                                                                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{profileData?.rollNumber || 'N/A'}</strong>
                                                            </div>
                                                        </>
                                                    )}
                                                    {profileData?.role === 'teacher' && subjects.length > 0 && (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <span style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>Subjects & Schedule</span>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                {subjects.map(sub => (
                                                                    <div key={sub._id} style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)' }}>
                                                                        <div style={{ fontWeight: '600', color: 'var(--brand-primary)' }}>{sub.subjectName}</div>
                                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                            {sub.classId?.className} • {sub.timeSlot || 'No time set'}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Coordinator status + revoke */}
                                                    {profileData?.classCoordinatorFor && (
                                                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(139,92,246,0.08))', borderRadius: '0.5rem', border: '1px solid rgba(139,92,246,0.2)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                <div>
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>Class Coordinator For</span>
                                                                    <strong style={{ color: '#8b5cf6', fontSize: '0.95rem' }}>
                                                                        ⭐ {typeof profileData.classCoordinatorFor === 'object'
                                                                            ? (profileData.classCoordinatorFor.className || 'Assigned Class')
                                                                            : 'Assigned Class'}
                                                                    </strong>
                                                                </div>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!window.confirm(`Remove coordinator status from ${profileData.name}?`)) return;
                                                                        setUpdatingParams(true);
                                                                        try {
                                                                            const res = await axios.delete(`/admin/revoke-coordinator/${profileData._id}`);
                                                                            setProfileData(prev => ({ ...prev, classCoordinatorFor: null }));
                                                                        } catch (err) {
                                                                            alert(err.response?.data?.message || 'Failed to revoke coordinator status');
                                                                        } finally {
                                                                            setUpdatingParams(false);
                                                                        }
                                                                    }}
                                                                    disabled={updatingParams}
                                                                    style={{
                                                                        background: '#fee2e2', color: '#dc2626',
                                                                        border: '1px solid rgba(220,38,38,0.3)',
                                                                        borderRadius: '0.5rem', padding: '0.4rem 0.85rem',
                                                                        fontSize: '0.8rem', fontWeight: '600',
                                                                        cursor: updatingParams ? 'not-allowed' : 'pointer',
                                                                        opacity: updatingParams ? 0.6 : 1,
                                                                        display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                                    }}
                                                                >
                                                                    ✕ Revoke Coordinator
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Profile Settings Mockup */}
                                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Profile Settings</h3>
                                                    <span style={{ fontSize: '0.75rem', background: 'var(--brand-primary)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>View Only</span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: '1rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>First Name</label>
                                                        <div className="input-field" style={{ opacity: 0.7, padding: '0.5rem', fontSize: '0.875rem' }}>
                                                            {user.name.split(' ')[0] || user.name}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Last Name</label>
                                                        <div className="input-field" style={{ opacity: 0.7, padding: '0.5rem', fontSize: '0.875rem' }}>
                                                            {user.name.split(' ').slice(1).join(' ') || '-'}
                                                        </div>
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.25rem' }}>Email</label>
                                                        <div className="input-field" style={{ opacity: 0.7, padding: '0.5rem', fontSize: '0.875rem' }}>
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- SUBJECTS TAB --- */}
                                    {activeTab === 'subjects' && (profileData?.role === 'student' || profileData?.role === 'teacher') && (
                                        <div style={{ maxWidth: '800px' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                                        <BookOpen size={18} /> {profileData?.role === 'student' ? 'Assigned Subjects' : 'Teaching Assignments'}
                                                    </h3>
                                                    {profileData?.role === 'student' && (
                                                        <button
                                                            onClick={() => { resetAssignForm(); setShowAssignModal(true); }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
                                                            onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                                                            onMouseOut={e => e.currentTarget.style.opacity = 1}
                                                        >
                                                            + Assign Subject
                                                        </button>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {profileData?.role === 'student' ? (
                                                        profileData?.enrolledSubjects?.length > 0 ? profileData.enrolledSubjects.map(es => (
                                                            <div key={es.subject?._id || Math.random()} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', color: 'var(--brand-primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>{es.subject?.subjectName || 'Unknown Subject'}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                                        {es.semester ? `Semester ${es.semester}` : 'No Semester'} • {es.year ? `Year ${es.year}` : 'No Year'}
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        onClick={() => openEditEnrolledSubject(es)}
                                                                        style={{ background: 'var(--bg-secondary)', color: 'var(--brand-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                                                        title="Edit Enrollment"
                                                                    >
                                                                        <Settings size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const sid = es.subject?._id || es.subject?.id || es.subject;
                                                                            handleRemoveSubject(sid);
                                                                        }}
                                                                        disabled={updatingParams}
                                                                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: updatingParams ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: updatingParams ? 0.5 : 1 }}
                                                                        title="Remove Subject"
                                                                    >
                                                                        <X size={16} /> Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div style={{ fontSize: '1rem', color: 'var(--text-light)', textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
                                                                <div style={{ marginBottom: '0.5rem' }}><BookOpen size={32} opacity={0.5} style={{ margin: '0 auto' }} /></div>
                                                                No subjects assigned yet.
                                                            </div>
                                                        )
                                                    ) : (
                                                        subjects.length > 0 ? subjects.map(sub => (
                                                            <div key={sub._id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', color: 'var(--brand-primary)', fontSize: '1rem', marginBottom: '0.25rem' }}>{sub.subjectId?.subjectName || 'Unknown Subject'}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                                        {sub.classId?.className} • {sub.dayOfWeek || 'No day'} • {sub.startTime || '??'} - {sub.endTime || '??'}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                                                        Room: {sub.roomNumber || 'N/A'} {sub.timeSlot ? `• Slot: ${sub.timeSlot}` : ''}
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        onClick={() => openEditAllocation(sub)}
                                                                        style={{ background: 'var(--bg-secondary)', color: 'var(--brand-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                                                        title="Edit Assignment"
                                                                    >
                                                                        <Settings size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveAllocation(sub._id)}
                                                                        disabled={updatingParams}
                                                                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: updatingParams ? 'not-allowed' : 'pointer', opacity: updatingParams ? 0.5 : 1 }}
                                                                        title="Remove Assignment"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div style={{ fontSize: '1rem', color: 'var(--text-light)', textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-primary)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
                                                                <div style={{ marginBottom: '0.5rem' }}><BookOpen size={32} opacity={0.5} style={{ margin: '0 auto' }} /></div>
                                                                No subjects assigned yet.
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- ATTENDANCE TAB --- */}
                                    {activeTab === 'attendance' && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>

                                            {/* LEFT: Stats */}
                                            <div style={{ flex: '1 1 0%', minWidth: 'min(100%, 300px)' }}>
                                                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                                            <Activity size={18} />
                                                            {profileData?.role === 'student' ? 'Attendance Stats' : 'Teaching Stats'}
                                                        </h3>
                                                        {selectedDate && (
                                                            <button
                                                                onClick={() => setSelectedDate(null)}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                            >
                                                                <X size={12} /> Clear Filter
                                                            </button>
                                                        )}
                                                    </div>

                                                    {selectedDate && (
                                                        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--brand-primary)', color: 'white', borderRadius: '0.5rem', textAlign: 'center', fontWeight: '500', fontSize: '0.875rem' }}>
                                                            Showing stats for: {format(selectedDate, 'MMMM d, yyyy')}
                                                        </div>
                                                    )}

                                                    {profileData?.role === 'student' ? (() => {
                                                        const displayStats = getStudentDisplayStats();
                                                        return (
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 80px), 1fr))', gap: '1rem', textAlign: 'center' }}>
                                                                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                                                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{displayStats.totalClasses}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Total</div>
                                                                </div>
                                                                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{displayStats.totalPresent}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Present</div>
                                                                </div>
                                                                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{displayStats.totalAbsent}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Absent</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })() : (() => {
                                                        const displayStats = getTeacherDisplayStats();
                                                        return (
                                                            <div style={{ display: 'flex' }}>
                                                                <div style={{ flex: 1, background: 'var(--bg-primary)', padding: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                    <span style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}><CalendarIcon size={24} /> Sessions</span>
                                                                    <strong style={{ fontSize: '2.5rem', color: 'var(--brand-primary)' }}>{displayStats.totalClassesConducted}</strong>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* RIGHT: Calendar Filter */}
                                            <div style={{ width: '100%', maxWidth: '350px', flexShrink: 0 }}>
                                                {renderCalendar()}
                                            </div>

                                        </div>
                                    )}

                                    {/* --- PERMISSIONS TAB --- */}
                                    {activeTab === 'permissions' && (
                                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                                        <Shield size={18} /> System Permissions
                                                    </h3>
                                                    {updatingParams && <span style={{ fontSize: '0.875rem', color: 'var(--brand-primary)', fontWeight: '500' }}>Saving changes...</span>}
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                                                    {ALL_SYSTEM_PERMISSIONS.filter(p => profileData?.permissions?.includes(p.id)).map(perm => {
                                                        const isEnabled = true; // Since we filtered, it's always true here
                                                        return (
                                                            <div key={perm.id} style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                padding: '1.25rem', background: 'var(--bg-primary)',
                                                                border: '1px solid var(--brand-primary)',
                                                                borderRadius: '0.5rem',
                                                                opacity: updatingParams ? 0.7 : 1,
                                                                transition: 'border-color 0.3s'
                                                            }}>
                                                                <div>
                                                                    <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{perm.label}</div>
                                                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{perm.desc}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => togglePermission(perm.id)}
                                                                    disabled={updatingParams}
                                                                    style={{
                                                                        position: 'relative', width: '52px', height: '28px',
                                                                        borderRadius: '14px', border: 'none', cursor: updatingParams ? 'not-allowed' : 'pointer',
                                                                        background: 'var(--brand-primary)',
                                                                        transition: 'background 0.3s',
                                                                        flexShrink: 0
                                                                    }}
                                                                >
                                                                    <motion.div
                                                                        layout
                                                                        animate={{ x: 26 }}
                                                                        transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                                                        style={{
                                                                            width: '24px', height: '24px', borderRadius: '50%',
                                                                            background: 'white', position: 'absolute', top: '2px',
                                                                            left: '2px',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                                        }}
                                                                    >
                                                                        <Check size={14} color="var(--brand-primary)" />
                                                                    </motion.div>
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!profileData?.permissions || profileData.permissions.length === 0) && (
                                                        <div style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
                                                            <Shield size={48} style={{ opacity: 0.1, marginBottom: '1rem', margin: '0 auto' }} />
                                                            <p style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Special Permissions</p>
                                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>This user has standard system access based on their role.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                                        Want to add or modify permissions?
                                                    </p>
                                                    <a href="/admin/permissions" style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                        color: 'var(--brand-primary)', fontWeight: '600', textDecoration: 'none',
                                                        fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                                        background: 'var(--brand-primary)10', transition: 'all 0.2s'
                                                    }}
                                                        onMouseOver={e => e.currentTarget.style.background = 'var(--brand-primary)20'}
                                                        onMouseOut={e => e.currentTarget.style.background = 'var(--brand-primary)10'}
                                                    >
                                                        Go to Permissions Manager <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- SETTINGS TAB --- */}
                                    {activeTab === 'settings' && (
                                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)' }}>Account Settings</h3>
                                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage user details and security.</p>
                                                    </div>

                                                    {/* Edit Mode Toggle Switch */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: editMode ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>Edit Mode</span>
                                                        <button
                                                            onClick={() => {
                                                                if (editMode) {
                                                                    // Reset form on cancel using latest profileData
                                                                    if (profileData) {
                                                                        setEditForm({
                                                                            name: profileData.name || '',
                                                                            email: profileData.email || '',
                                                                            password: '',
                                                                            departmentId: profileData.departmentId?._id || profileData.departmentId || '',
                                                                            classId: profileData.classId?._id || profileData.classId || '',
                                                                            section: profileData.section || '',
                                                                            rollNumber: profileData.rollNumber || '',
                                                                            parentEmail: profileData.parentEmail || ''
                                                                        });
                                                                    } else {
                                                                        setEditForm({
                                                                            name: user.name || '',
                                                                            email: user.email || '',
                                                                            password: '',
                                                                            departmentId: user.departmentId?._id || user.departmentId || '',
                                                                            classId: user.classId?._id || user.classId || '',
                                                                            section: user.section || '',
                                                                            rollNumber: user.rollNumber || '',
                                                                            parentEmail: user.parentEmail || ''
                                                                        });
                                                                    }
                                                                }
                                                                setEditMode(!editMode);
                                                            }}
                                                            style={{
                                                                position: 'relative', width: '48px', height: '26px',
                                                                borderRadius: '13px', border: 'none', cursor: 'pointer',
                                                                background: editMode ? 'var(--brand-primary)' : 'var(--border-color)',
                                                                transition: 'background 0.3s'
                                                            }}
                                                        >
                                                            <motion.div
                                                                layout
                                                                animate={{ x: editMode ? 24 : 2 }}
                                                                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                                                style={{
                                                                    width: '22px', height: '22px', borderRadius: '50%',
                                                                    background: 'white', position: 'absolute', top: '2px',
                                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                                }}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                                                        {editMode ? (
                                                            <input
                                                                type="text" name="name" className="input-field"
                                                                value={editForm.name} onChange={handleEditFormChange}
                                                                style={{ width: '100%' }}
                                                            />
                                                        ) : (
                                                            <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>{profileData?.name || user.name}</div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                                                        {editMode ? (
                                                            <input
                                                                type="email" name="email" className="input-field"
                                                                value={editForm.email} onChange={handleEditFormChange}
                                                                style={{ width: '100%' }}
                                                            />
                                                        ) : (
                                                            <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>{profileData?.email || user.email}</div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                                                        {editMode ? (
                                                            <>
                                                                <input
                                                                    type="password" name="password" className="input-field"
                                                                    placeholder="Leave blank to keep current password"
                                                                    value={editForm.password} onChange={handleEditFormChange}
                                                                    style={{ width: '100%' }}
                                                                />
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>Entering a password here will permanently change this user's password.</p>
                                                            </>
                                                        ) : (
                                                            <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>••••••••</div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Department</label>
                                                        {editMode ? (
                                                            <select
                                                                name="departmentId" className="input-field"
                                                                value={editForm.departmentId} onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value, classId: '' })}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <option value="">Select Department</option>
                                                                {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                                                            </select>
                                                        ) : (
                                                            <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>{profileData?.departmentId?.departmentName || 'N/A'}</div>
                                                        )}
                                                    </div>

                                                    {user.role === 'student' && (
                                                        <>
                                                            <div>
                                                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Class</label>
                                                                {editMode ? (
                                                                    <select
                                                                        name="classId" className="input-field"
                                                                        value={editForm.classId} onChange={handleEditFormChange}
                                                                        style={{ width: '100%' }}
                                                                        disabled={!editForm.departmentId}
                                                                    >
                                                                        <option value="">Select Class</option>
                                                                        {classes.filter(c => (c.departmentId?._id || c.departmentId) === editForm.departmentId).map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                                                                    </select>
                                                                ) : (
                                                                    <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>{profileData?.classId?.className || 'N/A'}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Section</label>
                                                                {editMode ? (
                                                                    <input
                                                                        type="text" name="section" className="input-field"
                                                                        value={editForm.section} onChange={handleEditFormChange}
                                                                        style={{ width: '100%' }}
                                                                        placeholder="e.g. A"
                                                                    />
                                                                ) : (
                                                                    <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>{profileData?.section || 'N/A'}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Roll Number</label>
                                                                {editMode ? (
                                                                    <input
                                                                        type="text" name="rollNumber" className="input-field"
                                                                        value={editForm.rollNumber} onChange={handleEditFormChange}
                                                                        style={{ width: '100%' }}
                                                                        placeholder="e.g. 1001"
                                                                    />
                                                                ) : (
                                                                    <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>{profileData?.rollNumber || 'N/A'}</div>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Parent Account Email</label>
                                                                {editMode ? (
                                                                    <input
                                                                        type="email" name="parentEmail" className="input-field"
                                                                        value={editForm.parentEmail} onChange={handleEditFormChange}
                                                                        style={{ width: '100%' }}
                                                                        placeholder="parent@example.com"
                                                                    />
                                                                ) : (
                                                                    <div className="input-field" style={{ opacity: 0.7, background: 'var(--bg-primary)' }}>
                                                                        {profileData?.parentEmail || 'No parent linked'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}

                                                    {editMode && (
                                                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                                            <button
                                                                className="btn btn-outline"
                                                                onClick={() => {
                                                                    if (profileData) {
                                                                        setEditForm({
                                                                            name: profileData.name || '',
                                                                            email: profileData.email || '',
                                                                            password: '',
                                                                            departmentId: profileData.departmentId?._id || profileData.departmentId || '',
                                                                            classId: profileData.classId?._id || profileData.classId || '',
                                                                            section: profileData.section || '',
                                                                            rollNumber: profileData.rollNumber || '',
                                                                            parentEmail: profileData.parentEmail || ''
                                                                        });
                                                                    } else {
                                                                        setEditForm({
                                                                            name: user.name || '',
                                                                            email: user.email || '',
                                                                            password: '',
                                                                            departmentId: user.departmentId?._id || user.departmentId || '',
                                                                            classId: user.classId?._id || user.classId || '',
                                                                            section: user.section || '',
                                                                            rollNumber: user.rollNumber || '',
                                                                            parentEmail: user.parentEmail || ''
                                                                        });
                                                                    }
                                                                    setEditMode(false);
                                                                }}
                                                                disabled={updatingParams}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={saveChanges}
                                                                disabled={updatingParams || (!editForm.name || !editForm.email)}
                                                            >
                                                                {updatingParams ? 'Saving...' : 'Save Changes'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </div>
                                    )}

                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Subject Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{
                                background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem',
                                width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {editingAllocation ? 'Edit Assignment' : 'Assign Subject'}
                                </h3>
                                <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><XIcon size={20} /></button>
                            </div>

                            <form onSubmit={handleAssignSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Select Subject</label>
                                    <select
                                        className="input-field"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                        value={assignForm.subjectId}
                                        onChange={e => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Select a subject --</option>
                                        {allSubjects
                                            .filter(sub => {
                                                if (profileData?.role !== 'student') return true;
                                                const studentDeptId = profileData?.departmentId?._id || profileData?.departmentId;
                                                const subDeptId = sub?.departmentId?._id || sub?.departmentId;
                                                return String(studentDeptId) === String(subDeptId);
                                            })
                                            .map(sub => (
                                                <option key={sub._id} value={sub._id} disabled={profileData.role === 'student' && editingAllocation}>
                                                    {sub.subjectName}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {profileData.role === 'teacher' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Select Class</label>
                                            <select
                                                className="input-field"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                value={assignForm.classId}
                                                onChange={e => setAssignForm({ ...assignForm, classId: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Select a class --</option>
                                                {classes.map(c => (
                                                    <option key={c._id} value={c._id}>
                                                        {c.className} ({c.departmentId?.departmentName || 'N/A'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Day</label>
                                                <select
                                                    className="input-field"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                    value={assignForm.dayOfWeek}
                                                    onChange={e => setAssignForm({ ...assignForm, dayOfWeek: e.target.value })}
                                                >
                                                    <option value="">Select Day</option>
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Room</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="e.g. 101"
                                                    style={{ width: '100%', padding: '0.75rem' }}
                                                    value={assignForm.roomNumber}
                                                    onChange={e => setAssignForm({ ...assignForm, roomNumber: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Start Time</label>
                                                <input
                                                    type="time"
                                                    className="input-field"
                                                    style={{ width: '100%', padding: '0.75rem' }}
                                                    value={assignForm.startTime}
                                                    onChange={e => setAssignForm({ ...assignForm, startTime: e.target.value })}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>End Time</label>
                                                <input
                                                    type="time"
                                                    className="input-field"
                                                    style={{ width: '100%', padding: '0.75rem' }}
                                                    value={assignForm.endTime}
                                                    onChange={e => setAssignForm({ ...assignForm, endTime: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {profileData.role === 'student' && (
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Semester</label>
                                            <select
                                                className="input-field"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                value={assignForm.semester}
                                                onChange={e => setAssignForm({ ...assignForm, semester: e.target.value })}
                                                required
                                            >
                                                <option value="">Select</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Year</label>
                                            <select
                                                className="input-field"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                value={assignForm.year}
                                                onChange={e => setAssignForm({ ...assignForm, year: e.target.value })}
                                                required
                                            >
                                                <option value="">Select</option>
                                                {['1st Year', '2nd Year', '3rd Year', '4th Year'].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!assignForm.subjectId || updatingParams || (profileData.role === 'teacher' && !assignForm.classId)}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        {updatingParams ? 'Saving...' : (editingAllocation ? 'Update' : 'Assign')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserProfileView;
