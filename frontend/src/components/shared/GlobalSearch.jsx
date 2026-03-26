import React, { useState } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = React.useRef(null);
    const navigate = useNavigate();

    // Close results when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setResults(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (val) => {
        if (!val.trim()) {
            setResults(null);
            return;
        }
        setIsSearching(true);
        try {
            const { data } = await axios.get(`/search?q=${val}`);
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced live search
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query) performSearch(query);
            else setResults(null);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        performSearch(query);
    };

    const handleResultClick = (path) => {
        navigate(path);
        setResults(null);
        setQuery('');
    };

    // CSS for result items
    const itemStyle = {
        fontSize: '0.875rem',
        padding: '0.5rem 0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        cursor: 'pointer',
        borderRadius: '6px',
        transition: 'background 0.2s',
    };

    const headerStyle = {
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        marginBottom: '0.25rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '2px',
        marginTop: '0.5rem'
    };

    return (
        <div ref={searchRef} style={{ position: 'relative', width: '300px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="var(--text-light)" style={{ position: 'absolute', left: '1rem' }} />
                <input
                    type="text"
                    className="input-field"
                    placeholder="Search students, classes..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => query && performSearch(query)}
                    style={{ paddingLeft: '2.5rem', borderRadius: '999px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', transition: 'all 0.3s ease' }}
                />
            </form>

            {results && query && (
                <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, width: '100%', padding: '0.5rem', zIndex: 50, maxHeight: '400px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    {isSearching ? <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', padding: '0.5rem' }}>Searching...</p> : (
                        <div>
                            {/* Departments */}
                            {results.departments?.length > 0 && (
                                <div>
                                    <h4 style={headerStyle}>Departments</h4>
                                    {results.departments.map(d => (
                                        <div key={d._id} onClick={() => handleResultClick('/admin/academic')} style={itemStyle} className="hover-bg">
                                            <span style={{ fontWeight: '500' }}>{d.departmentName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Students */}
                            {results.students?.length > 0 && (
                                <div>
                                    <h4 style={headerStyle}>Students</h4>
                                    {results.students.map(s => (
                                        <div key={s._id} onClick={() => handleResultClick('/admin/users')} style={itemStyle} className="hover-bg">
                                            <span style={{ fontWeight: '500' }}>{s.name}</span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{s.class?.className}-{s.section}</div>
                                                <div style={{ color: 'var(--brand-primary)', fontSize: '0.7rem', fontWeight: 'bold' }}>{s.department?.departmentName}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Teachers */}
                            {results.teachers?.length > 0 && (
                                <div>
                                    <h4 style={headerStyle}>Teachers</h4>
                                    {results.teachers.map(t => (
                                        <div key={t._id} onClick={() => handleResultClick('/admin/users')} style={itemStyle} className="hover-bg">
                                            <span style={{ fontWeight: '500' }}>{t.name}</span>
                                            <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{t.department?.departmentName || 'Faculty'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Classes */}
                            {results.classes?.length > 0 && (
                                <div>
                                    <h4 style={headerStyle}>Classes</h4>
                                    {results.classes.map(c => (
                                        <div key={c._id} onClick={() => handleResultClick('/admin/academic')} style={itemStyle} className="hover-bg">
                                            <span style={{ fontWeight: '500' }}>{c.className} - {c.section}</span>
                                            <span style={{ color: 'var(--brand-primary)', fontSize: '0.75rem' }}>{c.departmentId?.departmentName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Subjects */}
                            {results.subjects?.length > 0 && (
                                <div>
                                    <h4 style={headerStyle}>Subjects</h4>
                                    {results.subjects.map(sub => (
                                        <div key={sub._id} onClick={() => handleResultClick('/admin/subjects')} style={itemStyle} className="hover-bg">
                                            <span style={{ fontWeight: '500' }}>{sub.subjectName}</span>
                                            <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{sub.departmentId?.departmentName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!results.students?.length && !results.teachers?.length && !results.classes?.length && !results.subjects?.length && !results.departments?.length && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', textAlign: 'center', padding: '1rem 0' }}>No results found.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export default GlobalSearch;
