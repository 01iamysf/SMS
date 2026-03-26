import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Flame, Trophy } from 'lucide-react';

const StreaksPage = () => {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await axios.get('/student/leaderboard');
                setLeaderboard(data.leaderboard);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'linear-gradient(135deg, var(--brand-primary), var(--accent))', color: 'white' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame size={48} color="#f59e0b" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>My Current Streak</h2>
                    <p style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1 }}>{user?.streakCount || 0} Days</p>
                    <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>Best Streak: {user?.bestStreak || 0} Days</p>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Trophy size={20} color="var(--warning)" /> Class Leaderboard
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {leaderboard?.map((student, index) => (
                        <div key={student._id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: index === 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: index === 0 ? '1px solid var(--warning)' : '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: index === 0 ? 'var(--warning)' : 'var(--text-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p style={{ fontWeight: '600' }}>{student.name}</p>
                                    {student._id === user?._id && <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)' }}>(You)</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                                {student.streakCount} <Flame size={16} />
                            </div>
                        </div>
                    ))}
                    {(!leaderboard || leaderboard.length === 0) && <p style={{ color: 'var(--text-light)' }}>Leaderboard empty or unavailable.</p>}
                </div>
            </div>
        </div>
    );
};

export default StreaksPage;
