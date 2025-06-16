import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../config';
import axiosInstance from '../services/axiosInstance';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const contentRef = React.useRef(null);
    const [course, setCourse] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [assessmentAttempts, setAssessmentAttempts] = useState({});
    const [assessmentResults, setAssessmentResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [downloading, setDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [assessmentToDelete, setAssessmentToDelete] = useState(null);

    const handleDeleteClick = (assessmentId) => {
        setAssessmentToDelete(assessmentId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!assessmentToDelete) return;

        try {
            await axiosInstance.delete(`/Assessments/${assessmentToDelete}`);
            
            setAssessments(
                assessments.filter(
                    (assessment) => assessment.assessmentId !== assessmentToDelete
                )
            );
            setShowDeleteModal(false);
            setAssessmentToDelete(null);
            toast.success("Assessment deleted successfully!");
        } catch (err) {
            console.error("Error deleting assessment:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to delete assessment";
            toast.error(errorMessage);
            setError(errorMessage);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setAssessmentToDelete(null);
    };

    const handleMaterialDownload = async () => {
        setDownloading(true);
        setDownloadError("");
        try {
            if (!course.materialFileName) {
                toast.error("No study material available");
                throw new Error("No study material available");
            }
            const response = await fetch(
                `${config.API_BASE_URL}/api/file/sas/${encodeURIComponent(
                    course.materialFileName
                )}`
            );
            if (!response.ok) {
                toast.error("Failed to get download link");
                throw new Error("Failed to get download link");
            }
            const data = await response.json();
            console.log("SAS URL response:", data);
            window.open(data.sasUrl, "_blank");
            toast.success("Download started!");
        } catch (err) {
            setDownloadError(err.message);
            toast.error(err.message);
        } finally {
            setDownloading(false);
        }
    };

    const scrollToContent = () => {
        setActiveTab("content");
        // Small delay to ensure the content tab is rendered before scrolling
        setTimeout(() => {
            contentRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("No authentication token found");
                }

                // Fetch course details
                const courseResponse = await fetch(
                    `${config.API_BASE_URL}/api/Courses/${courseId}`,
                    {
                    headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!courseResponse.ok) {
                    throw new Error("Failed to fetch course details");
                }

                const courseData = await courseResponse.json();
                console.log("Fetched course data:", courseData);
                console.log("Material file name:", courseData.materialFileName);
                setCourse(courseData);

                // Fetch assessments for the course
                const assessmentsResponse = await fetch(
                    `${config.API_BASE_URL}/api/Assessments/course/${courseId}`,
                    {
                    headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!assessmentsResponse.ok) {
                    throw new Error("Failed to fetch assessments");
                }

                const assessmentsData = await assessmentsResponse.json();
                const processedAssessments = Array.isArray(assessmentsData)
                    ? assessmentsData
                    : assessmentsData.$values && Array.isArray(assessmentsData.$values)
                    ? assessmentsData.$values
                    : [];

                setAssessments(processedAssessments);

                // Fetch assessment attempts for each assessment
                const attempts = {};
                const results = {};
                for (const assessment of processedAssessments) {
                    try {
                        const resultsResponse = await fetch(
                            `${config.API_BASE_URL}/api/Results/student/${user.userId}/assessment/${assessment.assessmentId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            }
                        );

                        if (resultsResponse.status === 404) {
                            // If no results found, set attempts to 0 and continue
                            attempts[assessment.assessmentId] = 0;
                            continue;
                        }

                        if (!resultsResponse.ok) {
                            throw new Error(
                                `Failed to fetch results: ${resultsResponse.status}`
                            );
                        }

                        const result = await resultsResponse.json();
                        attempts[assessment.assessmentId] = 1; // Since we only get one result per student per assessment
                        results[assessment.assessmentId] = result.resultId; // Store the result ID
                    } catch (err) {
                        // Silently handle errors and set attempts to 0
                        attempts[assessment.assessmentId] = 0;
                    }
                }

                setAssessmentAttempts(attempts);
                setAssessmentResults(results);
            } catch (err) {
                console.error("Error fetching course details:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.userId) {
        fetchCourseDetails();
        }
    }, [courseId, user]);

    const handleDownload = (fileKey) => {
        const fileData = localStorage.getItem(fileKey);
        if (fileData) {
            const link = document.createElement("a");
            link.href = fileData;
            link.download = course.localFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-dark">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="alert alert-info" role="alert">
                    Course not found
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-white min-vh-100 py-4">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="container">
                {/* Course Header */}
            <div className="row mb-4">
                <div className="col-12">
                        <div className="card border-0 shadow-sm bg-white">
                                <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                        <h2 className="card-title mb-3">{course.title}</h2>
                                        <p className="card-text text-muted">{course.description}</p>
                                        <div className="mt-3">
                                            
                                            {course.courseUrl && (
                                                <button
                                                    onClick={scrollToContent}
                                                    className="btn btn-primary rounded-pill d-flex align-items-center gap-2"
                                                >
                                                    <i className="bi bi-play-circle me-2"></i>
                                                    Start Learning
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {course.mediaUrl && (
                                        <div className="ms-4" style={{ maxWidth: '500px' }}>
                                            <img
                                                src={course.mediaUrl}
                                                alt={course.title}
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '400px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                }}
                                            />
                                    </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

                {/* Navigation Tabs */}
            <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm bg-white">
                            <div className="card-body">
                                <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button 
                                            className={`nav-link ${activeTab === "overview" ? "active fw-bold" : ""}`}
                                            onClick={() => setActiveTab("overview")}
                            >
                                Overview
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                            className={`nav-link ${activeTab === "content" ? "active fw-bold" : ""}`}
                                            onClick={() => setActiveTab("content")}
                            >
                                Course Content
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                            className={`nav-link ${activeTab === "materials" ? "active fw-bold" : ""}`}
                                            onClick={() => setActiveTab("materials")}
                            >
                                            Assessments
                            </button>
                        </li>
                    </ul>

                                {/* Tab Content */}
                                <div className="tab-content bg-white p-3">
                                    {activeTab === "overview" && (
                                        <div
                                            className="card border-0 shadow-sm bg-white font-color m-4"
                                            id="courseContent"
                                        >
                                            <div className="card-body ">
                                    <h4 className="card-title mb-4">Course Overview</h4>
                                    <div className="mb-4">
                                        <h5>What you'll learn</h5>
                                        <ul className="list-unstyled">
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Understanding of key concepts
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Practical application of knowledge
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                                Hands-on experience with real-world examples
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5>Requirements</h5>
                                        <ul className="list-unstyled">
                                            <li className="mb-2">
                                                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                                                Basic understanding of the subject
                                            </li>
                                            <li className="mb-2">
                                                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                                                Willingness to learn and practice
                                            </li>
                                        </ul>
                                    </div>
                                                <br />
                                                {course.materialFileName && (
                                                    <div className="mb-4">
                                                        <h5>Study Material</h5>
                                                        <p>File: {course.materialFileName}</p>
                                                        <button
                                                            className="btn btn-outline-primary d-flex align-items-center"
                                                            onClick={handleMaterialDownload}
                                                            disabled={downloading}
                                                        >
                                                            <i className="bi bi-download me-2"></i>
                                                            {downloading ? "Preparing download..." : "Download Study Material"}
                                                        </button>
                                                        {downloadError && (
                                                            <div className="text-danger mt-2">{downloadError}</div>
                                                        )}
                                                    </div>
                                                )}
                                </div>
                            </div>
                        )}

                                    {activeTab === "content" && (
                                        <div ref={contentRef} className="card border-0 shadow-sm bg-white m-4">
                                <div className="card-body">
                                                <h4 className="card-title mb-4 font-color font">
                                                    Course Content
                                                </h4>
                                    {course.courseUrl && (
                                        <div className="mb-4">
                                            <div className="ratio ratio-16x9">
                                                <iframe 
                                                    src={course.courseUrl}
                                                    title="Course Video"
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    className="rounded"
                                                ></iframe>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                                    {activeTab === "materials" && (
                                        <div className="card border-0 shadow-sm bg-white m-4">
                                            <div className="card-body">
                                                <h4 className="card-title mb-4 font-color font">Assessments</h4>
                                        {assessments.length > 0 ? (
                                            <div className="row">
                                                {assessments.map((assessment) => (
                                                            <div
                                                                key={assessment.assessmentId}
                                                                className="col-md-4 mb-4"
                                                            >
                                                                <div className="card bg-white font-color h-100">
                                                            <div className="card-body">
                                                                        <h5 className="card-title bold">
                                                                            {assessment.title}
                                                                        </h5>
                                                                <div className="mb-3">
                                                                            <span className="custom-outline-filled me-2">
                                                                        <i className="bi bi-question-circle me-1"></i>
                                                                        {assessment.questionCount} Questions
                                                                    </span>
                                                                            <span className="custom-outline-filled">
                                                                        <i className="bi bi-star me-1"></i>
                                                                        Max Score: {assessment.maxScore}
                                                                    </span>
                                                                </div>
                                                                <p className="card-text text-muted">
                                                                            Test your knowledge and understanding of the
                                                                            course material.
                                                                </p>
                                                            </div>
                                                            <div className="card-footer bg-transparent border-top-0">
                                                                        {user?.role === "Instructor" ? (
                                                                    <div className="d-flex gap-2">
                                                                       {/* <Link
                                                                            to={`/edit-assessment/${assessment.assessmentId}`}
                                                                            className="btn btn-primary d-inline-flex align-items-center"
                                                                            >
                                                                            <i className="bi bi-pencil me-2"></i>
                                                                            Edit Assessment
                                                                        </Link>

                                                                        <button
                                                                                    className="custom-filled"
                                                                                    onClick={() =>
                                                                                        handleDeleteClick(assessment.assessmentId)
                                                                                    }
                                                                        >
                                                                            <i className="bi bi-trash me-2"></i>
                                                                            Delete
                                                                        </button> */}
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                {assessmentAttempts[assessment.assessmentId] >
                                                                                    0 ? (
                                                                                    <div>
                                                                                        <button
                                                                                            className="custom-filled font-color w-100 mb-2"
                                                                                            disabled
                                                                                        >
                                                                                            <i className="bi bi-check-circle me-2"></i>
                                                                                            Assessment Completed
                                                                                        </button>
                                                                                        <Link
                                                                                            to={`/results/${assessmentResults[assessment.assessmentId]}`}
                                                                                            className="btn btn-outline-info w-100 d-inline-flex align-items-center justify-content-center"
                                                                                        >
                                                                                            <i className="bi bi-eye me-2"></i>
                                                                                            View Results
                                                                                        </Link>
                                                                                    </div>
                                                                                ) : (
                                                                                    <Link
                                                                                    to={`/assessment/${assessment.assessmentId}`}
                                                                                    className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                                                                    >
                                                                                    <i className="bi bi-pencil-square me-2"></i>
                                                                                    Take Assessment
                                                                                    </Link>

                                                                                )}
                                                                            </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="alert alert-info">
                                                <i className="bi bi-info-circle me-2"></i>
                                                No assessments available for this course yet.
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                        </div>
                    </div>
                </div>
                                </div>

        </div>
    );
};

export default CourseDetails;
