import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, FileCheck, FileX, FileWarning, FileClock, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/* ── Per-type visual config ── */
const TYPE_CONFIG = {
    leave_request: {
        icon: FileClock,
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.4)',
        label: 'Leave Request'
    },
    leave_approved: {
        icon: FileCheck,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.35)',
        label: 'Approved'
    },
    leave_rejected: {
        icon: FileX,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.35)',
        label: 'Rejected'
    },
    leave_revoked: {
        icon: FileWarning,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.35)',
        label: 'Revoked'
    },
};

const DEFAULT_CONFIG = {
    icon: Bell,
    color: 'var(--brand-primary)',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.3)',
    label: 'Notification'
};

const getConfig = (type) => TYPE_CONFIG[type] || DEFAULT_CONFIG;

const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
};

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [clearing, setClearing] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await axios.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (err) {
            // Silently fail — backend may be starting up
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for real-time feel
        const interval = setInterval(fetchNotifications, 30000);
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (_) {}
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (_) {}
    };

    const clearAll = async () => {
        if (clearing) return;
        setClearing(true);
        try {
            await axios.delete('/notifications/clear-all');
            setNotifications([]);
            setUnreadCount(0);
        } catch (_) {}
        finally { setClearing(false); }
    };

    /* Click: mark read → navigate to link → close dropdown */
    const handleNotificationClick = async (n) => {
        if (!n.read) await markAsRead(n._id);
        setIsOpen(false);
        if (n.link) navigate(n.link);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
            {/* Bell Button */}
            <button
                id="notification-bell-btn"
                onClick={() => { setIsOpen(o => !o); if (!isOpen) fetchNotifications(); }}
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
                <motion.div
                    animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
                >
                    <Bell size={20} color="var(--text-primary)" />
                </motion.div>

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            position: 'absolute', top: -4, right: -4,
                            minWidth: '18px', height: '18px',
                            background: 'var(--danger, #ef4444)',
                            borderRadius: '999px',
                            border: '2px solid var(--bg-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', fontWeight: '800', color: 'white',
                            padding: '0 3px'
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="glass-panel"
                        style={{
                            position: 'fixed',
                            right: '0.75rem',
                            left: '0.75rem',
                            top: '5.5rem',
                            width: 'auto',
                            maxWidth: '400px',
                            marginLeft: 'auto',
                            background: 'var(--bg-secondary)',
                            zIndex: 99999,
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                            overflow: 'hidden',
                            maxHeight: 'calc(100vh - 6.25rem)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '0.85rem 1rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={15} style={{ color: 'var(--brand-primary)' }} />
                                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: '800',
                                        background: 'var(--brand-primary)', color: 'white',
                                        borderRadius: '999px', padding: '0 6px', lineHeight: '1.6'
                                    }}>
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        style={{
                                            background: 'none', border: 'none',
                                            color: 'var(--brand-primary)', fontSize: '0.72rem',
                                            cursor: 'pointer', fontWeight: '600', opacity: 0.8
                                        }}
                                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                                        onMouseOut={e => e.currentTarget.style.opacity = 0.8}
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        id="notification-clear-btn"
                                        onClick={clearAll}
                                        disabled={clearing}
                                        style={{
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.25)',
                                            color: '#ef4444',
                                            fontSize: '0.68rem', fontWeight: '700',
                                            cursor: clearing ? 'not-allowed' : 'pointer',
                                            borderRadius: '5px',
                                            padding: '3px 10px',
                                            opacity: clearing ? 0.5 : 1
                                        }}
                                    >
                                        {clearing ? '...' : 'Clear all'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <ul style={{
                            listStyle: 'none', padding: '0.5rem', margin: 0,
                            display: 'flex', flexDirection: 'column', gap: '0.25rem',
                            flex: 1, overflowY: 'auto'
                        }}>
                            {notifications.length === 0 ? (
                                <li style={{
                                    padding: '2.5rem 1rem', textAlign: 'center',
                                    color: 'var(--text-secondary)', fontSize: '0.85rem'
                                }}>
                                    <Bell size={28} style={{ opacity: 0.15, margin: '0 auto 0.5rem', display: 'block' }} />
                                    No notifications yet
                                </li>
                            ) : (
                                notifications.map((n, idx) => {
                                    const cfg = getConfig(n.type);
                                    const Icon = cfg.icon;
                                    const isClickable = !!n.link || !n.read;

                                    return (
                                        <motion.li
                                            key={n._id}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            onClick={() => handleNotificationClick(n)}
                                            style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                                                padding: '0.7rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                cursor: isClickable ? 'pointer' : 'default',
                                                background: n.read ? 'transparent' : cfg.bg,
                                                border: `1px solid ${n.read ? 'transparent' : cfg.border}`,
                                                transition: 'all 0.15s ease',
                                                position: 'relative'
                                            }}
                                            onMouseOver={e => {
                                                if (isClickable) e.currentTarget.style.background = n.read
                                                    ? 'rgba(255,255,255,0.04)'
                                                    : cfg.bg.replace('0.08', '0.14').replace('0.1', '0.18');
                                            }}
                                            onMouseOut={e => {
                                                e.currentTarget.style.background = n.read ? 'transparent' : cfg.bg;
                                            }}
                                        >
                                            {/* Icon bubble */}
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: cfg.bg, border: `1px solid ${cfg.border}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <Icon size={15} style={{ color: cfg.color }} />
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: '0.8rem',
                                                    color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                                                    lineHeight: '1.45',
                                                    margin: 0,
                                                    fontWeight: n.read ? '400' : '500'
                                                }}>
                                                    {n.message}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: '700',
                                                        color: cfg.color, textTransform: 'uppercase',
                                                        letterSpacing: '0.04em'
                                                    }}>
                                                        {cfg.label}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>
                                                        · {getTimeAgo(n.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Arrow if navigable */}
                                            {n.link && (
                                                <ChevronRight
                                                    size={14}
                                                    style={{ color: cfg.color, flexShrink: 0, marginTop: '4px', opacity: 0.7 }}
                                                />
                                            )}

                                            {/* Unread dot */}
                                            {!n.read && (
                                                <div style={{
                                                    position: 'absolute', top: '8px', right: n.link ? '22px' : '8px',
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: cfg.color
                                                }} />
                                            )}
                                        </motion.li>
                                    );
                                })
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
