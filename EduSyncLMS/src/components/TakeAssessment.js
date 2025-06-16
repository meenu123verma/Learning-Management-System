import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TakeAssessment = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No authentication token found');

                const response = await axios.get(
                    `${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_ID(assessmentId)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                setAssessment(response.data);
                setTimeLeft(response.data.timeLimit * 60); // Convert minutes to seconds
                setLoading(false);
            } catch (err) {
                console.error('Error fetching assessment:', err);
                setError('Failed to load assessment. Please try again.');
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [assessmentId]);

    useEffect(() => {
        if (timeLeft === null) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto-submit when time is up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            const response = await axios.post(
                `${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.SUBMIT}`,
                {
                    assessmentId,
                    answers: Object.entries(answers).map(([questionId, optionId]) => ({
                        questionId,
                        selectedOptionId: optionId
                    }))
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            toast.success('Assessment submitted successfully!');
            navigate(`/results/${response.data.resultId}`);
        } catch (err) {
            console.error('Error submitting assessment:', err);
            toast.error('Failed to submit assessment. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-5">
                <div className="container">
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-dark">Loading assessment...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-5">
                <div className="container">
                    <div className="alert alert-danger" role="alert">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid bg-white min-vh-100 py-5">
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="container">
                <div className="card bg-white shadow-sm">
                    <div className="card-header bg-white border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                            <h2 className="text-dark mb-0">{assessment.title}</h2>
                            <div className="timer-container">
                                <div className="timer-badge">
                                    <i className="bi bi-clock-fill me-2"></i>
                                    <span className="timer-text">
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        {assessment.questions.map((question, index) => (
                            <div key={question.questionId} className="card mb-4">
                                <div className="card-body">
                                    <h4 className="card-title text-dark mb-3">
                                        Question {index + 1} of {assessment.questions.length}
                                    </h4>
                                    <p className="card-text text-dark mb-4 fs-5">
                                        {question.questionText}
                                    </p>
                                    <div className="options-list">
                                        {question.options.map(option => (
                                            <div key={option.optionId} className="form-check mb-3">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    name={`question-${question.questionId}`}
                                                    id={`option-${option.optionId}`}
                                                    checked={answers[question.questionId] === option.optionId}
                                                    onChange={() => handleAnswerChange(question.questionId, option.optionId)}
                                                />
                                                <label
                                                    className="form-check-label fs-6"
                                                    htmlFor={`option-${option.optionId}`}
                                                >
                                                    {option.text}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="d-flex justify-content-between mt-4">
                            <div className="text-muted">
                                Total Questions: {assessment.questions.length}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length === 0}
                            >
                                Submit Assessment
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .timer-badge {
                    background-color: #0d6efd;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-size: 1.25rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .timer-text {
                    font-family: monospace;
                    letter-spacing: 1px;
                }
                .timer-badge i {
                    font-size: 1.5rem;
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                .timer-badge {
                    animation: pulse 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default TakeAssessment; 