import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBook, FaUser, FaClock, FaArrowRight } from 'react-icons/fa';
import config from '../config';

const AvailableCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No authentication token found');

                const response = await fetch(`${config.API_BASE_URL}/api/Courses/available`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch courses');

                const data = await response.json();
                setCourses(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error fetching courses:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleViewCourse = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    if (loading) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-dark">Loading available courses...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Available Courses</h2>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {courses.map((course) => (
                    <div key={course.courseId} className="col">
                        <div className="card h-100 shadow-sm">
                            <div className="position-relative">
                                {course.mediaUrl ? (
                                    <img
                                        src={course.mediaUrl}
                                        className="card-img-top"
                                        alt={course.title}
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div
                                        className="card-img-top bg-light d-flex align-items-center justify-content-center"
                                        style={{ height: '200px' }}
                                    >
                                        <FaBook className="text-muted" style={{ fontSize: '3rem' }} />
                                    </div>
                                )}
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">{course.title}</h5>
                                <p className="card-text text-muted">
                                    {course.description?.length > 100
                                        ? `${course.description.substring(0, 100)}...`
                                        : course.description}
                                </p>
                                <div className="d-flex align-items-center mb-3">
                                    <FaUser className="text-primary me-2" />
                                    <small className="text-muted">
                                        Instructor: {course.instructorName || 'Not specified'}
                                    </small>
                                </div>
                                <div className="d-flex align-items-center mb-3">
                                    <FaClock className="text-primary me-2" />
                                    <small className="text-muted">
                                        Duration: {course.duration || 'Not specified'}
                                    </small>
                                </div>
                            </div>
                            <div className="card-footer bg-white border-top-0">
                                <button
                                    className="btn btn-primary w-100"
                                    onClick={() => handleViewCourse(course.courseId)}
                                >
                                    View Course
                                    <FaArrowRight className="ms-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {courses.length === 0 && (
                <div className="text-center mt-5">
                    <FaBook className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                    <h4>No courses available</h4>
                    <p className="text-muted">Check back later for new courses</p>
                </div>
            )}
        </div>
    );
};

export default AvailableCourses; 