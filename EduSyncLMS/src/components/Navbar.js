import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaSearch, FaBook, FaClipboardList, FaChartBar, FaHome, FaPlus } from 'react-icons/fa';
import CreateCourse from './CreateCourse';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/dashboard';
        return user.role === 'Instructor' ? '/instructor-dashboard' : '/student-dashboard';
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleCreateCourseSuccess = () => {
        setShowCreateCourse(false);
        // Refresh the page or update the course list
        window.location.reload();
    };

    return (
        <>
            <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
            <div className="container">
                    <Link className="navbar-brand" to="/">
                        <FaBook className="text-primary me-2" />
                    EduSync
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                    <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                                <Link className="nav-link" to={getDashboardLink()}>
                                    <FaHome className="me-1" />
                                Dashboard
                            </Link>
                        </li>
                                <li className="nav-item">
                                <Link className="nav-link" to="/courses">
                                    <FaBook className="me-1" />
                                    Available Courses
                                    </Link>
                                </li>
                            {user?.role === 'Student' && (
                                <li className="nav-item">
                                    <Link className="nav-link" to="/all-results">
                                        <FaChartBar className="me-1" />
                                        My Results
                                    </Link>
                                </li>
                            )}
                            {user?.role === 'Instructor' && (
                                <>
                                    
                                <li className="nav-item">
                                        <Link className="nav-link" to="/instructor-results">
                                            <FaChartBar className="me-1" />
                                        Results
                                    </Link>
                                </li>
                            </>
                        )}
                            
                    </ul>

                        <form className="d-flex me-3" onSubmit={handleSearch}>
                            <div className="input-group">
                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="btn btn-outline-primary" type="submit">
                                    <FaSearch />
                                </button>
                            </div>
                        </form>

                        {user ? (
                            <div className="dropdown">
                                <button
                                    className="btn btn-link nav-link dropdown-toggle d-flex align-items-center"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <FaUser className="me-2" />
                                    {user.name}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <Link className="dropdown-item" to="/profile">
                                            <FaUser className="me-2" />
                                            Profile
                                        </Link>
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            <FaSignOutAlt className="me-2" />
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <div className="d-flex">
                                <Link to="/login" className="btn btn-outline-primary me-2">
                                    Login
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>



            <style>{`
                .navbar {
                    transition: all 0.3s ease;
                    padding: 1rem 0;
                    z-index: 1030;
                }
                .navbar.scrolled {
                    background: white;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .navbar-brand {
                    font-weight: bold;
                    font-size: 1.5rem;
                }
                .nav-link {
                    color: #333;
                    font-weight: 500;
                    transition: color 0.3s ease;
                    white-space: nowrap;
                    padding: 0.5rem 1rem;
                }
                .nav-link:hover {
                    color: #0d6efd;
                }
                .dropdown-menu {
                    border: none;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .dropdown-item {
                    color: #333;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }
                .dropdown-item:hover {
                    background-color: #f8f9fa;
                    color: #0d6efd;
                }
                .btn-outline-primary {
                    border-color: #0d6efd;
                    color: #0d6efd;
                }
                .btn-outline-primary:hover {
                    background-color: #0d6efd;
                    color: white;
                }
                .input-group {
                    width: 300px;
                }
                .input-group .form-control {
                    border-right: none;
                }
                .input-group .btn {
                    border-left: none;
                }
                @media (max-width: 991.98px) {
                    .navbar-collapse {
                        background: white;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    .input-group {
                        width: 100%;
                        margin: 1rem 0;
                    }
                    .nav-link {
                        padding: 0.5rem 0;
                    }
                }
                /* Add padding to main content to prevent navbar overlap */
                body {
                    padding-top: 76px;
                }
                /* Modal styles */
                .modal {
                    z-index: 1050;
                }
                .modal-backdrop {
                    z-index: 1040;
                }
                .modal-content {
                    border: none;
                    border-radius: 0.5rem;
                    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
                }
                .modal-header {
                    border-bottom: 1px solid #dee2e6;
                    padding: 1rem;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .btn-close {
                    padding: 1rem;
                    margin: -1rem -1rem -1rem auto;
                }
            `}</style>
        </>
    );
};

export default Navbar;
