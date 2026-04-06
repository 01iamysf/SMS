import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import adminAvatar from '../assets/admin_avatar.png';
import adminCover from '../assets/admin_cover.png';

// Configure Axios defaults
axios.defaults.baseURL = '/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUserProfile();
        } else {
            setLoading(false);
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            const { data } = await axios.get('/auth/profile');
            // Force static images for admin
            if (data.role === 'admin') {
                data.avatar = adminAvatar;
                data.coverImage = adminCover;
            }
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await axios.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setToken(data.token);
            // Force static images for admin
            if (data.role === 'admin') {
                data.avatar = adminAvatar;
                data.coverImage = adminCover;
            }
            setUser(data);
            return { success: true, role: data.role };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, fetchUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
