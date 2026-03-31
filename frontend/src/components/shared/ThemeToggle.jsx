import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark' || 
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && true) // Default to dark conceptually
    );

    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        
        // Initial sync
        setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        return () => observer.disconnect();
    }, []);

    const toggle = () => {
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle} 
            style={{
                width: '38px', height: '38px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--brand-primary)';
                e.currentTarget.style.borderColor = 'var(--brand-primary)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.2)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <motion.div
                initial={false}
                animate={{ rotate: isDark ? 360 : 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
        </motion.button>
    );
};

export default ThemeToggle;
