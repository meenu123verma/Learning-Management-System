import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const InstructorResults = () => {
    const { user } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState({
        course: 'all',
        assessment: 'all',
        student: 'all'
    });

    useEffect(() => {
        fetchAllResults();
    }, []);

    const fetchAllResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            const coursesResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.COURSES.INSTRUCTOR}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!coursesResponse.ok) throw new Error('Failed to fetch courses');

            const coursesData = await coursesResponse.json();
            const coursesArray = Array.isArray(coursesData) ? coursesData :
                (coursesData.$values && Array.isArray(coursesData.$values)) ? coursesData.$values : [];

            const allResults = [];
            for (const course of coursesArray) {
                try {
                    const assessmentsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_COURSE(course.courseId)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!assessmentsResponse.ok) continue;

                    const assessmentsData = await assessmentsResponse.json();
                    const assessments = Array.isArray(assessmentsData) ? assessmentsData :
                        (assessmentsData.$values && Array.isArray(assessmentsData.$values)) ? assessmentsData.$values : [];

                    for (const assessment of assessments) {
                        try {
                            const resultsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(assessment.assessmentId)}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (!resultsResponse.ok) continue;

                            const resultsData = await resultsResponse.json();
                            const resultsArr = Array.isArray(resultsData) ? resultsData :
                                (resultsData.$values && Array.isArray(resultsData.$values)) ? resultsData.$values : [];

                            const mappedResults = resultsArr.map(result => ({
                                ...result,
                                courseTitle: course.title,
                                courseId: course.courseId,
                                assessmentTitle: assessment.title,
                                assessmentId: assessment.assessmentId,
                                maxScore: assessment.maxScore
                            }));

                            allResults.push(...mappedResults);
                        } catch {
                            continue;
                        }
                    }
                } catch {
                    continue;
                }
            }

            allResults.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
            setResults(allResults);
        } catch (err) {
            setError(err.message || 'Failed to load results');
        } finally {
            setLoading(false);
        }
    };

    // Memoized filters for performance
    const uniqueCourses = useMemo(() => {
        const courses = results.map(r => ({ id: r.courseId, title: r.courseTitle }));
        return [...new Map(courses.map(c => [c.id, c])).values()];
    }, [results]);

    const uniqueAssessments = useMemo(() => {
        const assessments = results.map(r => ({ id: r.assessmentId, title: r.assessmentTitle }));
        return [...new Map(assessments.map(a => [a.id, a])).values()];
    }, [results]);

    const uniqueStudents = useMemo(() => {
        const students = new Map();
        results.forEach(r => {
            if (!students.has(r.userId)) {
                students.set(r.userId, { userId: r.userId, userName: r.userName || 'Unknown Student' });
            }
        });
        return Array.from(students.values());
    }, [results]);

    const getFilteredResults = () => {
        return results.filter(result => {
            if (filter.course !== 'all' && result.courseId !== filter.course) return false;
            if (filter.assessment !== 'all' && result.assessmentId !== filter.assessment) return false;
            if (filter.student !== 'all' && result.userId !== filter.student) return false;
            return true;
        });
    };

    if (loading) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-dark">Loading instructor results...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger" role="alert">{error}</div>
            </div>
        );
    }

    const filteredResults = getFilteredResults();

    return (
        <div className="container-fluid bg-white min-vh-100">
            <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-dark">Student Assessment Results</h2>
                <Link to="/instructor-dashboard" className="btn btn-outline-primary">
                    <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
                </Link>
            </div>

            {/* Filters Section */}
                <div className="card bg-white shadow-sm mb-4">
                    <div className="card-header bg-white border-bottom">
                        <h5 className="mb-0 text-dark">Filter Results</h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label htmlFor="filterCourse" className="form-label text-dark">Course</label>
                                <select
                                    id="filterCourse"
                                    className="form-select border-secondary"
                                    value={filter.course}
                                    onChange={e => setFilter(prev => ({ ...prev, course: e.target.value }))}
                                >
                                    <option value="all">All Courses</option>
                                    {uniqueCourses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="filterAssessment" className="form-label text-dark">Assessment</label>
                                <select
                                    id="filterAssessment"
                                    className="form-select border-secondary"
                                    value={filter.assessment}
                                    onChange={e => setFilter(prev => ({ ...prev, assessment: e.target.value }))}
                                >
                                    <option value="all">All Assessments</option>
                                    {uniqueAssessments.map(assessment => (
                                        <option key={assessment.id} value={assessment.id}>{assessment.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label htmlFor="filterStudent" className="form-label text-dark">Student</label>
                                <select
                                    id="filterStudent"
                                    className="form-select border-secondary"
                                    value={filter.student}
                                    onChange={e => setFilter(prev => ({ ...prev, student: e.target.value }))}
                                >
                                    <option value="all">All Students</option>
                                    {uniqueStudents.map(student => (
                                        <option key={student.userId} value={student.userId}>{student.userName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Results Section */}
            <section>
                {results.length === 0 ? (
                    <div className="alert alert-info">No assessment results available yet.</div>
                ) : filteredResults.length === 0 ? (
                    <div className="alert alert-warning">No results match the filter criteria.</div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {filteredResults.map(result => (
                            <div key={result.resultId} className="col">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                        className="card h-100 bg-white border-primary shadow-sm"
                                >
                                        <div className="card-body">
                                            <h5 className="card-title text-dark">{result.assessmentTitle}</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">{result.courseTitle}</h6>
                                        <div className="mb-3">
                                            <span className="badge bg-primary me-2">
                                                Score: {result.score} / {result.maxScore}
                                            </span>
                                            <span className="badge bg-success">
                                                {Math.round((result.score / result.maxScore) * 100)}%
                                            </span>
                                        </div>
                                            <p className="card-text text-dark mb-1">
                                            <strong>Student:</strong> {result.userName || 'Unknown Student'}
                                        </p>
                                            <p className="card-text text-dark mb-0">
                                            <strong>Attempted on:</strong> {new Date(result.attemptDate).toLocaleDateString()}
                                        </p>
                                        <Link 
                                                                                to={`/results/${result.resultId}`}
                                                                                className="btn btn-primary w-100"
                                                                            >
                                                                                View Details
                                                                            </Link>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            </div>

            <style>{`
                body {
                    background-color: white !important;
                }
                .container-fluid {
                    background-color: white;
                }
                .card {
                    transition: all 0.3s ease;
                    background-color: white;
                }
                .card:hover {
                    transform: translateY(-5px);
                }
                .badge {
                    font-size: 0.9rem;
                    padding: 0.5em 0.8em;
                }
                .form-select {
                    background-color: white;
                }
                .form-select:focus {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                .btn {
                    padding: 0.5rem 1rem;
                    font-weight: 500;
                }
                .btn-primary {
                    background-color: #0d6efd;
                    border-color: #0d6efd;
                }
                .btn-outline-primary {
                    color: #0d6efd;
                    border-color: #0d6efd;
                }
                .btn-outline-primary:hover {
                    background-color: #0d6efd;
                    color: white;
                }
                .alert {
                    background-color: white;
                    border: 1px solid #dee2e6;
                }
                .alert-info {
                    color: #0c5460;
                    background-color: #d1ecf1;
                    border-color: #bee5eb;
                }
                .alert-warning {
                    color: #856404;
                    background-color: #fff3cd;
                    border-color: #ffeeba;
                }
            `}</style>
        </div>
    );
};

export default InstructorResults;
