import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBook, FaUsers, FaClipboardCheck, FaChartLine, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../utils/axiosConfig';

const InstructorDashboard = () => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [studentResults, setStudentResults] = useState([]);
    const [newCourse, setNewCourse] = useState({
        title: '',
        description: '',
        mediaUrl: '',
        courseUrl: '',
        pdfFile: null
    });
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        totalAssessments: 0,
        averageScore: 0
    });

    useEffect(() => {
        // Log user information when component mounts
        console.log('Current user:', user);
        fetchInstructorCourses();
        fetchStudentResults();
    }, [user]); // Add user as a dependency

    const fetchInstructorCourses = async () => {
        try {
            const response = await axiosInstance.get('/Courses/instructor');
            // Ensure courses is always an array
            const coursesData = response.data;
            const processedCourses = Array.isArray(coursesData) ? coursesData : 
                                   (coursesData.$values && Array.isArray(coursesData.$values)) ? coursesData.$values : 
                                   [];
            console.log('Fetched courses:', processedCourses);
            setCourses(processedCourses);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to fetch courses. Please try again later.');
            setCourses([]); // Set empty array on error
        }
    };

    const fetchStudentResults = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // First get all courses
            const coursesResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.COURSES.INSTRUCTOR}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!coursesResponse.ok) {
                throw new Error('Failed to fetch courses');
            }

            const coursesData = await coursesResponse.json();
            let coursesArray = Array.isArray(coursesData) ? coursesData :
                             (coursesData.$values && Array.isArray(coursesData.$values)) ? coursesData.$values :
                             typeof coursesData === 'object' ? [coursesData] : [];

            // Get all results and enrolled students
            const allResults = [];
            const enrolledStudents = new Set();
            const assessmentIds = new Set();
            let totalScore = 0;
            let totalAssessmentsWithScores = 0;

            for (const course of coursesArray) {
                if (!course || !course.courseId) continue;

                try {
                    // Get assessments for this course
                    const assessmentsResponse = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_COURSE(course.courseId)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!assessmentsResponse.ok) continue;

                    const assessmentsData = await assessmentsResponse.json();
                    const assessments = Array.isArray(assessmentsData) ? assessmentsData :
                                     (assessmentsData.$values && Array.isArray(assessmentsData.$values)) ? assessmentsData.$values :
                                     typeof assessmentsData === 'object' ? [assessmentsData] : [];

                    // Add assessment IDs to the set
                    assessments.forEach(assessment => {
                        if (assessment && assessment.assessmentId) {
                            assessmentIds.add(assessment.assessmentId);
                        }
                    });

                    // Get results for each assessment
                    for (const assessment of assessments) {
                        if (!assessment || !assessment.assessmentId) continue;

                        try {
                            // Get submissions for this assessment
                            const submissionsResponse = await fetch(
                                `${config.API_BASE_URL}/api/Results/assessment/${assessment.assessmentId}/submissions`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );

                            if (!submissionsResponse.ok) continue;

                            const submissionsData = await submissionsResponse.json();
                            const submissions = Array.isArray(submissionsData) ? submissionsData :
                                             (submissionsData.$values && Array.isArray(submissionsData.$values)) ? submissionsData.$values : [];

                            // Add each student's ID to the set and process their results
                            submissions.forEach(submission => {
                                if (submission && submission.userId) {
                                    enrolledStudents.add(submission.userId);
                                    
                                    // Add to total score if we have valid scores
                                    if (submission.score >= 0 && submission.maxScore > 0) {
                                        const percentage = (submission.score / submission.maxScore) * 100;
                                        totalScore += percentage;
                                        totalAssessmentsWithScores++;
                                    }

                                    allResults.push({
                                        ...submission,
                                        courseTitle: course.title,
                                        courseId: course.courseId,
                                        assessmentTitle: assessment.title,
                                        assessmentId: assessment.assessmentId
                                    });
                                }
                            });
                        } catch (err) {
                            console.error(`Error fetching results for assessment ${assessment.title}:`, err);
                            continue;
                        }
                    }
                } catch (err) {
                    console.error(`Error processing course ${course.title}:`, err);
                    continue;
                }
            }

            // Update state with all the data
            setStudentResults(allResults);
            
            // Calculate average score
            const averageScore = totalAssessmentsWithScores > 0 
                ? Math.round(totalScore / totalAssessmentsWithScores) 
                : 0;

            // Update stats
            const stats = {
                totalCourses: coursesArray.length,
                totalStudents: enrolledStudents.size,
                totalAssessments: assessmentIds.size,
                averageScore: averageScore
            };

            // Update the stats in state
            setStats(stats);

        } catch (err) {
            console.error('Error fetching student results:', err);
            setError(err.message || 'Failed to load student results');
        }
    };

    // Add a function to clear the cache when needed
    const clearResultsCache = () => {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('assessment_results_')) {
                localStorage.removeItem(key);
            }
        });
    };

    // Add useEffect to clear cache when component unmounts
    useEffect(() => {
        return () => {
            clearResultsCache();
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCourse(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', {
            name: file?.name,
            type: file?.type,
            size: file?.size,
            lastModified: file?.lastModified
        });

        if (file && file.type === 'application/pdf') {
            setNewCourse(prev => ({
                ...prev,
                pdfFile: file
            }));
            console.log('PDF file set in state successfully');
        } else {
            console.error('Invalid file type:', file?.type);
            setError('Please upload a PDF file');
        }
    };

    // Update handleSubmit to use the correct endpoint and validate courseId
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (!storedUser || !storedUser.userId) {
                throw new Error('User information not found. Please log in again.');
            }

            // Create the course data object
            const courseData = {
                title: newCourse.title,
                description: newCourse.description,
                instructorId: storedUser.userId,
                mediaUrl: newCourse.mediaUrl || '',
                courseUrl: newCourse.courseUrl || ''
            };

            let response;
            let courseId;

            try {
                if (editingCourse) {
                    // Update existing course
                    response = await axiosInstance.put(`/Courses/${editingCourse.courseId}`, courseData);
                    courseId = editingCourse.courseId;
                    toast.success('Course updated successfully!');
                } else {
                    // Create new course
                    response = await axiosInstance.post('/Courses', courseData);
                    courseId = response.data.courseId;
                    toast.success('Course created successfully!');
                }
            } catch (error) {
                console.error('Error saving course:', error);
                throw new Error(`Failed to ${editingCourse ? 'update' : 'create'} course: ${error.response?.data?.message || error.message}`);
            }

            // If we have a PDF file, try to upload it
            if (newCourse.pdfFile) {
                try {
                    console.log('Starting file upload for course:', courseId);
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', newCourse.pdfFile);

                    // Log file details before upload
                    console.log('File details:', {
                        name: newCourse.pdfFile.name,
                        type: newCourse.pdfFile.type,
                        size: newCourse.pdfFile.size
                    });

                    // Try to upload the file using the new endpoint
                    const uploadResponse = await axiosInstance.post(
                        `/Courses/upload/${courseId}`,
                        uploadFormData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            },
                            onUploadProgress: (progressEvent) => {
                                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                console.log('Upload progress:', percentCompleted + '%');
                            }
                        }
                    );

                    console.log('File upload response:', uploadResponse.data);

                    if (uploadResponse.data.fileUrl) {
                        toast.success('Course material uploaded successfully!');
                    } else {
                        throw new Error('File upload response did not contain file URL');
                    }
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    toast.error(`Failed to upload course material: ${uploadError.response?.data?.message || uploadError.message}`);
                    // Don't throw here, as we still want to refresh the course list
                }
            }

            // Refresh the courses list
            await fetchInstructorCourses();
            
            // Reset the form
            setShowModal(false);
            setNewCourse({
                title: '',
                description: '',
                mediaUrl: '',
                courseUrl: '',
                pdfFile: null
            });
            setEditingCourse(null);

        } catch (error) {
            console.error('Error in handleSubmit:', error);
            setError(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course?')) {
            return;
        }

        try {
            await axiosInstance.delete(`/Courses/${courseId}`);
            setCourses(courses.filter(course => course.courseId !== courseId));
            toast.success('Course deleted successfully');
        } catch (error) {
            // Error is already handled by axios interceptor
            console.error('Error deleting course:', error);
        }
    };

    const handlePdfDownload = async (courseId) => {
        try {
            const response = await axiosInstance.get(`/Courses/download/${courseId}`, {
                responseType: 'blob'
            });
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(response.data);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = `course-${courseId}.pdf`;
            document.body.appendChild(link);
            
            // Trigger the download
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
        } catch (error) {
            // Error is already handled by axios interceptor
            console.error('Error downloading PDF:', error);
        }
    };

    return (
        <div className="container-fluid bg-white text-dark min-vh-100" style={{ paddingTop: '40px' }}>
            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="card bg-white border-primary shadow-lg rounded-4 h-100"
                    >
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-primary mb-2 fw-bold">Total Courses</h6>
                                    <h2 className="text-dark mb-0 display-6 fw-bold">{stats.totalCourses}</h2>
                                    <p className="text-muted mt-2 mb-0">Active courses you're teaching</p>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-4 rounded-4">
                                    <FaBook className="text-primary" size={32} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="col-md-4 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="card bg-white border-info shadow-lg rounded-4 h-100"
                    >
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-info mb-2 fw-bold">Total Assessments</h6>
                                    <h2 className="text-dark mb-0 display-6 fw-bold">{stats.totalAssessments}</h2>
                                    <p className="text-muted mt-2 mb-0">Assessments created across all courses</p>
                                </div>
                                <div className="bg-info bg-opacity-10 p-4 rounded-4">
                                    <FaClipboardCheck className="text-info" size={32} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
                <div className="col-md-4 mb-4">
                    <motion.div
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="card bg-white border-success shadow-lg rounded-4 h-100"
                    >
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-success mb-2 fw-bold">Average Score</h6>
                                    <h2 className="text-dark mb-0 display-6 fw-bold">{stats.averageScore}%</h2>
                                    <p className="text-muted mt-2 mb-0">Average score across all assessments</p>
                                </div>
                                <div className="bg-success bg-opacity-10 p-4 rounded-4">
                                    <FaChartLine className="text-success" size={32} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Course Management Section */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="text-dark">My Courses</h3>
                        <button 
                            className="btn btn-primary rounded-pill d-flex align-items-center gap-2"
                            onClick={() => {
                                setEditingCourse(null);
                                setNewCourse({
                                    title: '',
                                    description: '',
                                    mediaUrl: '',
                                    courseUrl: '',
                                    pdfFile: null
                                });
                                setShowModal(true);
                            }}
                        >
                            <FaPlus /> Add New Course
                        </button>
                    </div>

                    <div className="row">
                        {courses.map((course) => (
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
                                        <div className="mb-3">
                                            {course.courseUrl && (
                                                <div className="mb-2">
                                                    <small className="text-muted">
                                                        <i className="bi bi-link-45deg"></i> Course Link Available
                                                    </small>
                                                </div>
                                            )}
                                            {course.pdfUrl && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <small className="text-muted">
                                                        <i className="bi bi-file-pdf"></i> Course PDF Available
                                                    </small>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handlePdfDownload(course.courseId)}
                                                        title="Download PDF"
                                                    >
                                                        <i className="bi bi-download"></i> Download
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-transparent border-top-0">
                                        <div className="d-flex gap-2">
                                            <Link 
                                                to={`/create-assessment/${course.courseId}`}
                                                className="btn btn-success rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                            >
                                                <FaClipboardCheck /> Create Assessment
                                            </Link>
                                            <button 
                                                className="btn btn-primary rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                                onClick={() => {
                                                    setEditingCourse(course);
                                                    setNewCourse({
                                                        title: course.title,
                                                        description: course.description,
                                                        mediaUrl: course.mediaUrl || '',
                                                        courseUrl: course.courseUrl || '',
                                                        pdfFile: null
                                                    });
                                                    setShowModal(true);
                                                }}
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button 
                                                className="btn btn-danger rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                                onClick={() => handleDelete(course.courseId)}
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Course Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title text-dark">
                                {editingCourse ? 'Edit Course' : 'Create New Course'}
                            </h5>
                            <button 
                                className="btn-close" 
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingCourse(null);
                                    setNewCourse({
                                        title: '',
                                        description: '',
                                        mediaUrl: '',
                                        courseUrl: '',
                                        pdfFile: null
                                    });
                                }}
                            ></button>
                        </div>
                        <div className="modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                    <label htmlFor="title" className="form-label text-dark">Course Title</label>
                                        <input
                                            type="text"
                                        className="form-control"
                                            id="title"
                                            name="title"
                                            value={newCourse.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                    <label htmlFor="description" className="form-label text-dark">Description</label>
                                        <textarea
                                        className="form-control"
                                            id="description"
                                            name="description"
                                            value={newCourse.description}
                                            onChange={handleInputChange}
                                            rows="4"
                                            required
                                    ></textarea>
                                    </div>
                                    <div className="mb-3">
                                    <label htmlFor="mediaUrl" className="form-label text-dark">Thumbnail URL</label>
                                        <input
                                            type="url"
                                        className="form-control"
                                            id="mediaUrl"
                                            name="mediaUrl"
                                            value={newCourse.mediaUrl}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div className="mb-3">
                                    <label htmlFor="courseUrl" className="form-label text-dark">Course Content URL</label>
                                        <input
                                            type="url"
                                        className="form-control"
                                            id="courseUrl"
                                            name="courseUrl"
                                            value={newCourse.courseUrl}
                                            onChange={handleInputChange}
                                        placeholder="https://example.com/course-content"
                                        />
                                    </div>
                                <div className="mb-3">
                                    <label htmlFor="pdfFile" className="form-label text-dark">Course PDF</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="pdfFile"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                    />
                                    <small className="text-muted">Upload a PDF file for the course content</small>
                                </div>
                                <div className="modal-footer">
                                        <button 
                                            type="button" 
                                        className="btn btn-secondary rounded-pill"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingCourse(null);
                                            setNewCourse({
                                                title: '',
                                                description: '',
                                                mediaUrl: '',
                                                courseUrl: '',
                                                pdfFile: null
                                            });
                                        }}
                                        >
                                            Cancel
                                        </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary rounded-pill"
                                    >
                                        {editingCourse ? 'Update Course' : 'Create Course'}
                                        </button>
                                    </div>
                                </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Results Section */}
            {/* <div className="row mb-4">
                <div className="col-12">
                <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="text-dark">Recent Student Results</h3>
                        <Link to="/instructor-results" className="btn btn-primary rounded-pill">
                        <i className="bi bi-list-check me-2"></i>
                        View All Results
                    </Link>
                </div>
                    <div className="row">
                        {studentResults.slice(0, 3).map((result) => (
                            <div key={result.resultId} className="col-md-4 mb-4">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="card bg-white border-primary shadow-lg h-100"
                                >
                                    <div className="card-body">
                                        <h5 className="card-title text-dark">{result.assessmentTitle}</h5>
                                        <p className="card-text text-muted">Course: {result.courseTitle}</p>
                                        <div className="mb-3">
                                            <span className="badge bg-primary me-2">
                                                Score: {result.score} / {result.maxScore}
                                            </span>
                                            <span className="badge bg-success">
                                                {Math.round((result.score / result.maxScore) * 100)}%
                                            </span>
                                        </div>
                                        <p className="card-text text-muted">
                                            Student: {result.userName}<br />
                                            Attempted on: {new Date(result.attemptDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                        </div>
                </div>
            </div> */}

            <style>{`
                .card {
                    transition: all 0.3s ease;
                    border-width: 2px;
                }
                .card:hover {
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                }
                .display-6 {
                    font-size: 2.5rem;
                }
                .bg-opacity-10 {
                    background-color: rgba(var(--bs-primary-rgb), 0.1);
                }
                .rounded-4 {
                    border-radius: 1rem;
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
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1050;
                }
                .modal-content {
                    background: white;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 700px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-body {
                    padding: 1.5rem;
                }
                .modal-footer {
                    padding: 1.5rem;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .form-label {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                }
                .form-control {
                    padding: 0.75rem;
                    border: 1px solid #ced4da;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                .form-control:focus {
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
                }
                .btn-close {
                    padding: 0.5rem;
                    margin: -0.5rem -0.5rem -0.5rem auto;
                    background: transparent;
                    border: 0;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                }
                .btn-close:hover {
                    color: #333;
                }
                .btn {
                    padding: 0.75rem 1.5rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                .btn-primary {
                    background: linear-gradient(45deg, #0d6efd, #0a58ca);
                    border: none;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(13, 110, 253, 0.4);
                }
                .btn-secondary {
                    background: #6c757d;
                    border: none;
                    color: white;
                }
                .btn-secondary:hover {
                    background: #5a6268;
                    transform: translateY(-2px);
                }
                .btn-sm {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                }
                
                .btn-outline-primary {
                    border-color: #0d6efd;
                    color: #0d6efd;
                }
                
                .btn-outline-primary:hover {
                    background-color: #0d6efd;
                    color: white;
                }
                
                .bi-download {
                    margin-right: 0.25rem;
                }
            `}</style>
        </div>
    );
};

export default InstructorDashboard;