import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { FaSearch, FaPlus, FaBook, FaUserGraduate } from 'react-icons/fa';

const Courses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('search') || '';
        setSearchQuery(query);
        fetchCourses(query);
    }, [location.search, user?.role]);

    const fetchCourses = async (query = '') => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            let endpoint;
            if (location.pathname === '/courses/enrolled') {
                endpoint = '/api/courses/enrolled';
            } else if (user?.role === 'Instructor') {
                endpoint = '/api/courses/instructor';
            } else {
                endpoint = '/api/courses';
            }

            const url = `${config.API_BASE_URL}${endpoint}`;
            console.log('Fetching courses from:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.status} ${response.statusText}`);
            }

            let data = await response.json();
            console.log('Raw API response:', data);

            // Handle different response formats
            let coursesArray = [];
            if (data.$values && Array.isArray(data.$values)) {
                coursesArray = data.$values;
            } else if (Array.isArray(data)) {
                coursesArray = data;
            } else if (typeof data === 'object') {
                coursesArray = [data];
            }

            console.log('Processed courses array:', coursesArray);

            // Filter courses based on search query
            if (query) {
                const searchLower = query.toLowerCase();
                coursesArray = coursesArray.filter(course => 
                    (course.title?.toLowerCase().includes(searchLower) ||
                    course.description?.toLowerCase().includes(searchLower))
                );
            }

            setCourses(coursesArray);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(err.message || 'Failed to load courses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/courses');
        }
    };

    const getPageTitle = () => {
        if (location.pathname === '/courses/enrolled') {
            return 'Enrolled Courses';
        }
        return user?.role === 'Instructor' ? 'My Courses' : 'Available Courses';
    };

    if (loading) {
        return (
            <div className="container-fluid px-4 py-5 bg-white min-vh-100" style={{ marginTop: '60px' }}>
                <div className="container">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted">Loading courses...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid px-4 py-5 bg-white min-vh-100" style={{ marginTop: '60px' }}>
                <div className="container">
                    <div className="alert alert-danger" role="alert">
                        <h4 className="alert-heading">Error Loading Courses</h4>
                        <p>{error}</p>
                        <hr />
                        <button 
                            className="btn btn-outline-danger" 
                            onClick={() => fetchCourses(searchQuery)}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid px-4 py-5 bg-white min-vh-100" style={{ marginTop: '0px' }}>
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-dark mb-0">{getPageTitle()}</h2>
                    {user?.role === 'Instructor' && location.pathname !== '/courses/enrolled' && (
                        <Link to="/courses/create" className="btn btn-primary">
                            <FaPlus className="me-2" />
                            Create Course
                        </Link>
                    )}
                </div>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <form onSubmit={handleSearch} className="d-flex">
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
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="text-center py-5">
                        <div className="mb-3">
                            <FaBook className="text-muted" style={{ fontSize: '3rem' }} />
                        </div>
                        <h4 className="text-dark mb-3">No Courses Found</h4>
                        <p className="text-muted">
                            {location.pathname === '/courses/enrolled' 
                                ? 'You are not enrolled in any courses yet.'
                                : user?.role === 'Instructor'
                                    ? 'Start creating your courses to share your knowledge!'
                                    : 'No courses match your search criteria.'}
                        </p>
                        {user?.role === 'Instructor' && location.pathname !== '/courses/enrolled' && (
                            <Link to="/courses/create" className="btn btn-primary mt-3">
                                <FaPlus className="me-2" />
                                Create Your First Course
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="row">
                        {courses.map((course) => {
                            // Ensure course is a valid object with required properties
                            if (!course || typeof course !== 'object') return null;
                            
                            return (
                                <div key={course.courseId || Math.random()} className="col-md-6 col-lg-4 mb-4">
                                    <div className="card h-100 border-1 shadow-sm">
                                        <div className="course-thumbnail">
                                            {course.mediaUrl ? (
                                                <img
                                                    src={course.mediaUrl}
                                                    className="card-img-top"
                                                    alt={course.title || 'Course thumbnail'}
                                                />
                                            ) : (
                                                <div className="default-thumbnail">
                                                    <FaBook className="text-primary" style={{ fontSize: '3rem' }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <h5 className="card-title text-dark">{course.title || 'Untitled Course'}</h5>
                                            <p className="card-text text-muted">
                                                {course.description ? `${course.description.substring(0, 100)}...` : 'No description available'}
                                            </p>
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                {/* <div className="d-flex align-items-center">
                                                    <FaUserGraduate className="text-primary me-2" />
                                                    <small className="text-muted">
                                                        {course.enrolledStudents || 0} Students
                                                    </small>
                                                </div> */}
                                                <Link
                                                    to={`/course/${course.courseId}`}
                                                    className="btn btn-outline-primary"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                .card {
                    transition: all 0.3s ease;
                    background: white;
                    overflow: hidden;
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
                }
                .course-thumbnail {
                    height: 200px;
                    overflow: hidden;
                    background: #f8f9fa;
                }
                .course-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }
                .card:hover .course-thumbnail img {
                    transform: scale(1.05);
                }
                .default-thumbnail {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8f9fa;
                }
                .btn-outline-primary {
                    border-color: #0d6efd;
                    color: #0d6efd;
                    transition: all 0.3s ease;
                }
                .btn-outline-primary:hover {
                    background: #0d6efd;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(13, 110, 253, 0.4);
                }
                .input-group {
                    width: 100%;
                }
                .input-group .form-control {
                    border-right: none;
                    background: white;
                }
                .input-group .btn {
                    border-left: none;
                }
                .form-control:focus {
                    box-shadow: none;
                    border-color: #0d6efd;
                }
                .alert {
                    background: white;
                    border: 1px solid #dc3545;
                }
                .spinner-border {
                    color: #0d6efd;
                }
            `}</style>
        </div>
    );
};

export default Courses; 