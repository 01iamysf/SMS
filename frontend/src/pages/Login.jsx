import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import './Login.css';
import illustration from '../assets/login-illustration.png';
import shieldIcon from '../assets/shield-check.png';

const StreakPopup = ({ streak, bestStreak, onClose }) => {
    let icon = '😞';
    let message = 'Keep trying! Your streak is low.';
    if (streak >= 5) { icon = '🔥'; message = 'You are on fire! Amazing streak!'; }
    else if (streak >= 2) { icon = '🙂'; message = 'Good job! Keep it up!'; }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="streak-popup-overlay"
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 100, display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="glass-panel"
                style={{ padding: '2.5rem', textAlign: 'center', maxWidth: '420px', width: '100%', border: '1px solid rgba(255, 255, 255, 0.2)' }}
            >
                <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>{icon}</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Welcome Back!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>{message}</p>

                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '16px' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '500' }}>Current Streak</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{streak}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '500' }}>Best Streak</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{bestStreak}</div>
                    </div>
                </div>

                <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                    Enter Dashboard
                </button>
            </motion.div>
        </motion.div>
    );
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showStreakPopup, setShowStreakPopup] = useState(false);

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !showStreakPopup) {
            redirectUser(user.role);
        }
    }, [user, navigate, showStreakPopup]);

    const redirectUser = (role) => {
        switch (role) {
            case 'admin': navigate('/admin'); break;
            case 'teacher': navigate('/teacher'); break;
            case 'student': navigate('/student'); break;
            case 'parent': navigate('/parent'); break;
            default: navigate('/');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await login(email, password);
            setIsLoading(false);

            if (res.success) {
                if (res.role === 'student' && res.user) {
                    setShowStreakPopup(true);
                } else {
                    redirectUser(res.role);
                }
            } else {
                setError(res.message);
            }
        } catch (err) {
            setIsLoading(false);
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <AnimatePresence>
                {showStreakPopup && user && (
                    <StreakPopup
                        streak={user.streakCount || 0}
                        bestStreak={user.bestStreak || 0}
                        onClose={() => {
                            setShowStreakPopup(false);
                            redirectUser('student');
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="login-container">
                {/* Left Side: Illustration */}
                <div className="login-illustration-section">
                    <motion.img
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        src={illustration}
                        alt="Classroom Illustration"
                        className="login-illustration"
                    />
                </div>

                {/* Right Side: Login Form */}
                <div className="login-form-section">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="login-card"
                    >
                        <div className="shield-icon-container">
                            <img src={shieldIcon} alt="Shield Check" className="shield-icon" />
                        </div>

                        <div className="login-header">
                            <h1>Welcome Back!</h1>
                            <p>Login to Student Attendance System</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="error-message"
                            >
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <Mail className="input-icon" size={20} />
                                    <input
                                        type="email"
                                        className="login-input"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <div className="input-wrapper">
                                    <Lock className="input-icon" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="login-input"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="forgot-password">
                                <a href="#" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
                            </div>

                            <button type="submit" className="login-btn" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Login'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Login;
