import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaClock, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa';
import config from '../config';

const AssessmentPage = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(0);

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
                setTimeLeft(data.duration || 60); // Default to 60 minutes if not specified
            } catch (err) {
                console.error('Error fetching assessment:', err);
                setError(err.message);
            } finally {
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
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(`${config.API_BASE_URL}/api/Assessments/${assessmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    answers: answers
                })
            });

            if (!response.ok) throw new Error('Failed to submit assessment');

            const result = await response.json();
            navigate(`/assessment-result/${assessmentId}`, { state: { result } });
        } catch (err) {
            console.error('Error submitting assessment:', err);
            setError(err.message);
        }
    };

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

    if (!assessment) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning" role="alert">
                    Assessment not found
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-8 mx-auto">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="mb-0">{assessment.title}</h4>
                                <div className="d-flex align-items-center">
                                    <FaClock className="text-primary me-2" />
                                    <span className="text-muted">
                                        Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="progress mb-4">
                                <div 
                                    className="progress-bar" 
                                    role="progressbar" 
                                    style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}
                                >
                                    Question {currentQuestion + 1} of {assessment.questions.length}
                                </div>
                            </div>

                            {assessment.questions[currentQuestion] && (
                                <div className="question-container">
                                    <h5 className="mb-4">
                                        <FaQuestionCircle className="text-primary me-2" />
                                        {assessment.questions[currentQuestion].text}
                                    </h5>
                                    <div className="options-list">
                                        {assessment.questions[currentQuestion].options.map((option, index) => (
                                            <div 
                                                key={index} 
                                                className="form-check mb-3"
                                            >
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name={`question-${assessment.questions[currentQuestion].id}`}
                                                    id={`option-${index}`}
                                                    checked={answers[assessment.questions[currentQuestion].id] === option}
                                                    onChange={() => handleAnswerChange(assessment.questions[currentQuestion].id, option)}
                                                />
                                                <label className="form-check-label" htmlFor={`option-${index}`}>
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex justify-content-between mt-4">
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestion === 0}
                                >
                                    Previous
                                </button>
                                {currentQuestion < assessment.questions.length - 1 ? (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setCurrentQuestion(prev => prev + 1)}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-success"
                                        onClick={handleSubmit}
                                    >
                                        <FaCheckCircle className="me-2" />
                                        Submit Assessment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssessmentPage; 