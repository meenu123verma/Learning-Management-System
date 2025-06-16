import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import config from '../config';
import { FaBook, FaClipboardCheck, FaChartLine, FaClock, FaStar, FaGraduationCap, FaCalendarAlt } from 'react-icons/fa';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [courseAssessments, setCourseAssessments] = useState({});
    const [assessmentResults, setAssessmentResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resultsCache, setResultsCache] = useState(new Map());

    const fetchAssessmentsForCourse = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching assessments for course:', courseId);

            const response = await fetch(`${config.API_BASE_URL}/api/Assessments/course/${courseId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 404) {
                    console.log('No assessments found for course:', courseId);
                    return [];
                }
                throw new Error(errorData.message || `Failed to fetch assessments: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched assessments:', data);
            
            const assessments = Array.isArray(data) ? data : 
                              (data.$values && Array.isArray(data.$values)) ? data.$values : [];
            
            console.log('Processed assessments:', assessments);
            return assessments;
        } catch (err) {
            console.error(`Error fetching assessments for course ${courseId}:`, err);
            return [];
        }
    };

    const fetchEnrolledCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching enrolled courses...');

            const response = await fetch(`${config.API_BASE_URL}/api/Courses/enrolled`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch enrolled courses: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched enrolled courses:', data);
            
            const enrolledCourses = Array.isArray(data) ? data : 
                                  (data.$values && Array.isArray(data.$values)) ? data.$values : [];
            
            console.log('Processed enrolled courses:', enrolledCourses);
            setEnrolledCourses(enrolledCourses);

            // Fetch assessments for each enrolled course
            const assessmentsMap = {};
            for (const course of enrolledCourses) {
                const assessments = await fetchAssessmentsForCourse(course.courseId);
                assessmentsMap[course.courseId] = assessments;
            }
            setCourseAssessments(assessmentsMap);

            return enrolledCourses;
        } catch (err) {
            console.error('Error fetching enrolled courses:', err);
            setError(err.message || 'Failed to load enrolled courses');
            setEnrolledCourses([]);
            return [];
        }
    };

    const fetchCourses = async (enrolledCoursesData) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Fetching available courses...');
            console.log('Current enrolled courses data:', enrolledCoursesData);

            const response = await fetch(`${config.API_BASE_URL}/api/Courses/available`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch courses: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw API response:', data);
            
            // Handle the response format correctly
            const allCourses = Array.isArray(data) ? data : 
                              (data.$values && Array.isArray(data.$values)) ? data.$values : [];
            
            console.log('All courses after array check:', allCourses);
            
            // Filter out courses that are already enrolled
            const availableCourses = allCourses.filter(course => {
                if (!course || !course.courseId) {
                    console.log('Invalid course object:', course);
                    return false;
                }
                const isEnrolled = enrolledCoursesData.some(enrolled => {
                    console.log('Comparing:', {
                        enrolledCourseId: enrolled?.courseId,
                        currentCourseId: course.courseId
                    });
                    return enrolled?.courseId === course.courseId;
                });
                console.log(`Course ${course.courseId} - ${course.title} is enrolled:`, isEnrolled);
                return !isEnrolled;
            });
            
            console.log('Final filtered available courses:', availableCourses);
            setCourses(availableCourses);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(err.message || 'Failed to load courses');
            setCourses([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchAssessmentResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // First get all enrolled courses
            const enrolledResponse = await fetch(`${config.API_BASE_URL}/api/Courses/enrolled`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!enrolledResponse.ok) {
                throw new Error('Failed to fetch enrolled courses');
            }

            const enrolledCourses = await enrolledResponse.json();
            const processedEnrolledCourses = Array.isArray(enrolledCourses) ? enrolledCourses : 
                                          (enrolledCourses.$values && Array.isArray(enrolledCourses.$values)) ? enrolledCourses.$values : [];

            // Get all assessment results for enrolled courses
            const allResults = [];
            for (const course of processedEnrolledCourses) {
                const assessments = await fetchAssessmentsForCourse(course.courseId);
                for (const assessment of assessments) {
                    try {
                        // Fetch assessment details to get questions
                        const assessmentDetailsResponse = await fetch(
                            `${config.API_BASE_URL}/api/Assessments/${assessment.assessmentId}`,
                            {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        if (!assessmentDetailsResponse.ok) continue;
                        const assessmentDetails = await assessmentDetailsResponse.json();
                        const questions = Array.isArray(assessmentDetails.questions) ? assessmentDetails.questions :
                                       (assessmentDetails.questions?.$values && Array.isArray(assessmentDetails.questions.$values)) ? 
                                       assessmentDetails.questions.$values : [];

                        // Fetch results for this assessment
                        const resultsResponse = await fetch(
                            `${config.API_BASE_URL}/api/Results/student/${user.userId}/assessment/${assessment.assessmentId}`,
                            {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        if (resultsResponse.ok) {
                            const result = await resultsResponse.json();
                            const mappedResult = {
                                ...result,
                                assessmentTitle: assessment.title,
                                courseTitle: course.title,
                                courseId: course.courseId,
                                totalQuestions: questions.length
                            };
                            allResults.push(mappedResult);
                        }
                    } catch (err) {
                        console.error(`Error fetching results for assessment ${assessment.assessmentId}:`, err);
                    }
                }
            }

            // Sort results by attempt date (most recent first)
            allResults.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
            console.log('Final assessment results:', allResults);
            setAssessmentResults(allResults);
        } catch (err) {
            console.error('Error fetching assessment results:', err);
            setError(err.message || 'Failed to load assessment results');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Clear the results cache
                setResultsCache(new Map());
                const enrolled = await fetchEnrolledCourses();
                console.log('Enrolled courses before fetching available:', enrolled);
                await fetchCourses(enrolled);
                await fetchAssessmentResults();
            } catch (err) {
                console.error('Error loading data:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleEnroll = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('Attempting to enroll in course:', courseId);

            const response = await fetch(`${config.API_BASE_URL}/api/Courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                console.error('Enrollment error response:', data);
                throw new Error(data.message || `Failed to enroll: ${response.status}`);
            }

            console.log('Enrollment successful:', data);

            // First fetch enrolled courses
            const enrolled = await fetchEnrolledCourses();
            // Then fetch available courses using the updated enrolled courses
            await fetchCourses(enrolled);
            
            alert(data.message || 'Successfully enrolled in the course!');
        } catch (err) {
            console.error('Error enrolling in course:', err);
            if (err.message.includes('Failed to fetch')) {
                setError('Network error: Please check if the backend server is running and accessible.');
            } else {
                setError(err.message || 'Failed to enroll in course');
            }
        }
    };

    // Calculate statistics
    const stats = {
        enrolledCourses: enrolledCourses.length,
        completedAssessments: assessmentResults.length,
        averageScore: assessmentResults.length > 0
            ? Math.round(assessmentResults.reduce((acc, curr) => {
                const totalQuestions = curr.totalQuestions || 0;
                const score = curr.score || 0;
                const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
                return acc + percentage;
              }, 0) / assessmentResults.length)
            : 0,
        lastActivity: assessmentResults.length > 0
            ? new Date(Math.max(...assessmentResults.map(a => new Date(a.attemptDate)))).toLocaleDateString()
            : 'No activity'
    };

    if (loading) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-dark">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-white text-dark min-vh-100" style={{ paddingTop: '30px' }}>
            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-3 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="card bg-white border-primary shadow-lg rounded-4"
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-primary mb-2">Enrolled Courses</h6>
                                    <h2 className="text-dark mb-0">{stats.enrolledCourses}</h2>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                                    <FaBook className="text-primary" size={24} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="col-md-3 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="card bg-white border-success shadow-lg rounded-4"
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-success mb-2">Completed Assessments</h6>
                                    <h2 className="text-dark mb-0">{stats.completedAssessments}</h2>
                                </div>
                                <div className="bg-success bg-opacity-10 p-3 rounded-3">
                                    <FaClipboardCheck className="text-success" size={24} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="col-md-3 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="card bg-white border-info shadow-lg rounded-4"
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-info mb-2">Average Score</h6>
                                    <h2 className="text-dark mb-0">{stats.averageScore}%</h2>
                                </div>
                                <div className="bg-info bg-opacity-10 p-3 rounded-3">
                                    <FaChartLine className="text-info" size={24} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="col-md-3 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="card bg-white border-warning shadow-lg rounded-4"
                    >
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-warning mb-2">Last Activity</h6>
                                    <h2 className="text-dark mb-0">{stats.lastActivity}</h2>
                                </div>
                                <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                                    <FaCalendarAlt className="text-warning" size={24} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Results Section */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card bg-white shadow-sm">
                        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                            <h3 className="text-dark mb-0">Recent Assessment Results</h3>
                            <Link to="/all-results" className="btn btn-primary rounded-pill">
                                <i className="bi bi-list-check me-2"></i>
                            View All Results
                        </Link>
                    </div>
                                    <div className="card-body">
                            {assessmentResults.length === 0 ? (
                                <div className="alert alert-info">No assessment results available.</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Assessment</th>
                                                <th>Course</th>
                                                <th>Score</th>
                                                <th>Percentage</th>
                                                <th>Attempt Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assessmentResults.slice(0, 3).map(result => {
                                                const percentage = result.totalQuestions > 0 
                                                    ? Math.round((result.score / result.totalQuestions) * 100)
                                                    : 0;

                                                return (
                                                    <tr key={result.resultId}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-file-text text-primary me-2"></i>
                                                                {result.assessmentTitle}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-book text-success me-2"></i>
                                                                {result.courseTitle}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-primary">
                                                                {result.score} / {result.totalQuestions}
                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                                                    <div 
                                                                        className={`progress-bar ${percentage >= 70 ? 'bg-success' : percentage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                                                        role="progressbar"
                                                                        style={{ width: `${percentage}%` }}
                                                                        aria-valuenow={percentage}
                                                                        aria-valuemin="0"
                                                                        aria-valuemax="100"
                                                                    ></div>
                                                                </div>
                                                                <span className="text-nowrap">{percentage}%</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <i className="bi bi-calendar3 text-muted me-2"></i>
                                                                {new Date(result.attemptDate).toLocaleString()}
                                        </div>
                                                        </td>
                                                        <td>
                                        <Link 
                                            to={`/results/${result.resultId}`}
                                                                className="btn btn-primary btn-sm rounded-pill"
                                        >
                                                                <i className="bi bi-eye me-1"></i>
                                            View Details
                                        </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    </div>
                            )}
                            </div>
                    </div>
                </div>
            </div>

            {/* Enrolled Courses Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <h3 className="text-dark mb-4">My Courses</h3>
                    <div className="row">
                        {enrolledCourses.map((course) => (
                            <div key={course.courseId} className="col-md-6 col-lg-4 mb-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="card bg-white border-primary shadow-lg h-100"
                                >
                                    {course.mediaUrl && (
                                        <div className="course-thumbnail">
                                        <img 
                                            src={course.mediaUrl} 
                                                alt={course.title}
                                            className="card-img-top" 
                                            style={{ height: '200px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                                                }}
                                        />
                                        </div>
                                    )}
                                    <div className="card-body">
                                        <h5 className="card-title text-dark">{course.title}</h5>
                                        <p className="card-text text-muted">{course.description}</p>
                                        <div className="mt-3">
                                            <p className="card-text">
                                                <small className="text-muted">
                                                    <FaGraduationCap className="text-primary me-2" />
                                                    Instructor: {course.instructor?.name || 'Unknown'}
                                                </small>
                                            </p>
                                            {course.courseUrl && (
                                                <p className="card-text">
                                                    <small className="text-muted">
                                                        <i className="bi bi-link-45deg"></i> Course Link Available
                                                    </small>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-top-0">
                                        <div className="d-grid">
                                            <Link 
                                                to={`/course/${course.courseId}`}
                                                className="btn btn-primary rounded-pill"
                                            >
                                                <i className="bi bi-eye me-2"></i>
                                                View Course
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Available Courses Section */}
            <div className="row">
    <div className="col-12">
        <h3 className="text-dark mb-4">Available Courses</h3>
        <div className="row">
                {courses.length === 0 ? (
                <div className="col-12">
                    <div className="alert alert-info text-center" role="alert">
                        No courses available at the moment.
                    </div>
                    </div>
                ) : (
                courses.map((course) => (
                            <div key={course.courseId} className="col-md-6 col-lg-4 mb-4">
                                <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="card bg-white border-primary shadow-lg h-100"
                                >
                                    {course.mediaUrl && (
                                <div className="course-thumbnail">
                                        <img 
                                            src={course.mediaUrl} 
                                        alt={course.title}
                                            className="card-img-top" 
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                                        }}
                                        />
                                </div>
                                    )}
                                    <div className="card-body">
                                <h5 className="card-title text-dark">{course.title}</h5>
                                <p className="card-text text-muted">{course.description}</p>
                                        <div className="mt-3">
                                            <p className="card-text">
                                        <small className="text-muted">
                                            <FaGraduationCap className="text-primary me-2" />
                                                    Instructor: {course.instructor?.name || 'Unknown'}
                                                </small>
                                            </p>
                                    {course.courseUrl && (
                                        <p className="card-text">
                                            <small className="text-muted">
                                                <i className="bi bi-link-45deg"></i> Course Link Available
                                            </small>
                                        </p>
                                    )}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-top-0">
                                        <button
                                            onClick={() => handleEnroll(course.courseId)}
                                    className="btn btn-primary w-100 rounded-pill"
                                        >
                                            Enroll Now
                                        </button>
                                    </div>
                                </motion.div>
                                </div>
                ))
                )}
            </div>
    </div>
</div>


            <style>{`
                .card {
                    transition: all 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-5px);
                }
                .course-thumbnail {
                    position: relative;
                    overflow: hidden;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
                .course-thumbnail img {
                    width: 100%;
                    transition: transform 0.3s ease;
                }
                .card:hover .course-thumbnail img {
                    transform: scale(1.05);
                }
                .btn-primary {
                    background: linear-gradient(45deg, #0d6efd, #0a58ca);
                    border: none;
                    transition: all 0.3s ease;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(13, 110, 253, 0.4);
                }
            `}</style>

            <style>{`
                .progress {
                    background-color: #e9ecef;
                    border-radius: 0.5rem;
                }
                .progress-bar {
                    transition: width 0.6s ease;
                }
                .table > :not(caption) > * > * {
                    padding: 1rem;
                }
                .badge {
                    font-size: 0.9rem;
                    padding: 0.5rem 0.75rem;
                }
            `}</style>
        </div>
    );
};

export default StudentDashboard; 