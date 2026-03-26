import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/api/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Refresh notifications every minute
        const interval = setInterval(fetchNotifications, 60000);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearInterval(interval);
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                <Bell size={20} color="var(--text-primary)" />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -2, width: '10px', height: '10px',
                        background: 'var(--danger)', borderRadius: '50%', border: '2px solid white'
                    }} />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="glass-panel"
                        style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: '300px',
                            padding: '1rem', zIndex: 1000
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        {notifications.length > 0 ? (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {notifications.map(n => (
                                    <li key={n._id} onClick={() => !n.read && markAsRead(n._id)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)', cursor: n.read ? 'default' : 'pointer', transition: 'background 0.2s ease', borderLeft: n.read ? '2px solid transparent' : '2px solid var(--brand-primary)' }}>
                                        <p style={{ fontSize: '0.875rem', color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: '1.4' }}>{n.message}</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{getTimeAgo(n.createdAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No fresh notifications.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
