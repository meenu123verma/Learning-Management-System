import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaChartBar, FaTrophy, FaArrowLeft } from 'react-icons/fa';
import config from '../config';

const AssessmentResult = () => {
    const { assessmentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [result, setResult] = useState(location.state?.result || null);
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No authentication token found');

                const response = await fetch(`${config.API_BASE_URL}/api/Assessments/${assessmentId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch assessment');

                const data = await response.json();
                setAssessment(data);
            } catch (err) {
                console.error('Error fetching assessment:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (!result) {
            fetchAssessment();
        } else {
            setLoading(false);
        }
    }, [assessmentId, result]);

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
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

    if (!result || !assessment) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning" role="alert">
                    Result not found
                </div>
            </div>
        );
    }

    const scorePercentage = (result.score / assessment.maxScore) * 100;
    const isPassing = scorePercentage >= 60;

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-8 mx-auto">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">Assessment Results</h4>
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={() => navigate(-1)}
                                >
                                    <FaArrowLeft className="me-2" />
                                    Back to Course
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="text-center mb-4">
                                <div className="display-1 mb-3">
                                    {isPassing ? (
                                        <FaTrophy className="text-success" />
                                    ) : (
                                        <FaChartBar className="text-primary" />
                                    )}
                                </div>
                                <h2 className="mb-3">{assessment.title}</h2>
                                <div className="score-display mb-4">
                                    <h1 className="display-4 mb-0">{result.score}</h1>
                                    <p className="text-muted">out of {assessment.maxScore}</p>
                                </div>
                                <div className="progress mb-4" style={{ height: '20px' }}>
                                    <div
                                        className={`progress-bar ${isPassing ? 'bg-success' : 'bg-danger'}`}
                                        role="progressbar"
                                        style={{ width: `${scorePercentage}%` }}
                                    >
                                        {scorePercentage.toFixed(1)}%
                                    </div>
                                </div>
                                <h4 className={`mb-4 ${isPassing ? 'text-success' : 'text-danger'}`}>
                                    {isPassing ? 'Congratulations! You passed!' : 'Not passed. Keep practicing!'}
                                </h4>
                            </div>

                            <div className="results-breakdown">
                                <h5 className="mb-3">Question Analysis</h5>
                                {result.questionResults.map((questionResult, index) => (
                                    <div key={index} className="card mb-3">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center mb-2">
                                                {questionResult.isCorrect ? (
                                                    <FaCheckCircle className="text-success me-2" />
                                                ) : (
                                                    <FaTimesCircle className="text-danger me-2" />
                                                )}
                                                <h6 className="mb-0">Question {index + 1}</h6>
                                            </div>
                                            <p className="mb-2">{questionResult.question}</p>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <p className="mb-1">
                                                        <strong>Your Answer:</strong> {questionResult.userAnswer}
                                                    </p>
                                                </div>
                                                <div className="col-md-6">
                                                    <p className="mb-1">
                                                        <strong>Correct Answer:</strong> {questionResult.correctAnswer}
                                                    </p>
                                                </div>
                                            </div>
                                            {questionResult.explanation && (
                                                <div className="mt-2">
                                                    <p className="mb-0">
                                                        <strong>Explanation:</strong> {questionResult.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/course/${assessment.courseId}`)}
                                >
                                    Return to Course
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentResult; 