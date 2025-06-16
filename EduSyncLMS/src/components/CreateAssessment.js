import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/Course.css';

const CreateAssessment = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [assessment, setAssessment] = useState({
        title: '',
        maxScore: 1, // Default to 1 point per question
        timeLimit: 60, // Default to 60 minutes
        questions: [
            {
                questionText: '',
                options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]
            }
        ]
    });

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...assessment.questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        setAssessment({ ...assessment, questions: newQuestions });
    };

    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        const newQuestions = [...assessment.questions];
        newQuestions[questionIndex].options[optionIndex] = {
            ...newQuestions[questionIndex].options[optionIndex],
            [field]: value
        };
        setAssessment({ ...assessment, questions: newQuestions });
    };

    const addQuestion = () => {
        setAssessment({
            ...assessment,
            questions: [
                ...assessment.questions,
                {
                    questionText: '',
                    options: [
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false },
                        { text: '', isCorrect: false }
                    ]
                }
            ],
            maxScore: assessment.questions.length + 1 // Update maxScore when adding a question
        });
    };

    const removeQuestion = (index) => {
        const updatedQuestions = assessment.questions.filter((_, i) => i !== index);
        setAssessment({
            ...assessment,
            questions: updatedQuestions,
            maxScore: updatedQuestions.length // Update maxScore when removing a question
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate that each question has exactly one correct answer
            const hasInvalidQuestions = assessment.questions.some(
                question => !question.options.some(option => option.isCorrect)
            );

            if (hasInvalidQuestions) {
                alert('Each question must have exactly one correct answer.');
                return;
            }

            const token = localStorage.getItem('token');
            
            // Create a clean assessment object without circular references
            const assessmentData = {
                assessmentId: crypto.randomUUID(),
                courseId: courseId,
                title: assessment.title,
                maxScore: assessment.questions.length,
                timeLimit: assessment.timeLimit,
                questions: assessment.questions.map(q => ({
                    questionId: crypto.randomUUID(),
                    questionText: q.questionText,
                    options: q.options.map(o => ({
                        optionId: crypto.randomUUID(),
                        text: o.text,
                        isCorrect: o.isCorrect
                    }))
                }))
            };

            const response = await axios.post(
                `${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.CREATE}`,
                assessmentData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 201) {
                navigate(`/course/${courseId}`);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response:', error.response.data);
                alert(`Failed to create assessment: ${error.response.data.message || 'Unknown error'}`);
            } else if (error.request) {
                // The request was made but no response was received
                alert('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                alert('Error setting up the request. Please try again.');
            }
        }
    };

    return (
        <div className="container-fluid bg-white min-vh-100 py-5">
            <div className="container">
                <div className="card bg-white shadow-sm">
                    <div className="card-header bg-white border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                            <h2 className="text-dark mb-0">Create New Assessment</h2>
                            <div className="assessment-summary">
                                <span className="badge bg-primary me-2">
                                    <i className="bi bi-question-circle me-1"></i>
                                    {assessment.questions.length} Questions
                                </span>
                                <span className="badge bg-info">
                                    <i className="bi bi-clock me-1"></i>
                                    {assessment.timeLimit} Minutes
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
            <form onSubmit={handleSubmit}>
                            <div className="row mb-4">
                                <div className="col-md-8">
                <div className="form-group">
                                        <label className="form-label fw-bold">Assessment Title:</label>
                    <input
                        type="text"
                                            className="form-control form-control-lg"
                        value={assessment.title}
                        onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
                                            placeholder="Enter assessment title"
                        required
                    />
                                    </div>
                </div>

                </div>

                {assessment.questions.map((question, questionIndex) => (
                                <div key={questionIndex} className="card mb-4 border-primary">
                                    <div className="card-header bg-light">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h4 className="card-title text-dark mb-0">
                                                <span className="badge bg-primary me-2">Q{questionIndex + 1}</span>
                                                Question {questionIndex + 1}
                                            </h4>
                            <button
                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                onClick={() => removeQuestion(questionIndex)}
                                disabled={assessment.questions.length === 1}
                            >
                                                <i className="bi bi-trash me-1"></i>
                                                Delete Question
                            </button>
                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-group mb-4">
                                            <label className="form-label fw-bold">Question Text:</label>
                                            <textarea
                                                className="form-control"
                                                rows="3"
                                value={question.questionText}
                                onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                                                placeholder="Enter your question here..."
                                required
                            />
                        </div>

                        <div className="options-container">
                                            <label className="form-label fw-bold mb-3">Options:</label>
                            {question.options.map((option, optionIndex) => (
                                                <div key={optionIndex} className="option-item mb-3">
                                                    <div className="input-group">
                                                        <span className="input-group-text bg-light">
                                                            <i className="bi bi-arrow-right-short"></i>
                                                        </span>
                                    <input
                                        type="text"
                                                            className={`form-control ${option.isCorrect ? 'border-success' : ''}`}
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                        required
                                    />
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                        <input
                                            type="radio"
                                                                    className="form-check-input"
                                            name={`question-${questionIndex}`}
                                            checked={option.isCorrect}
                                            onChange={() => {
                                                const updatedOptions = question.options.map((opt, idx) => ({
                                                    ...opt,
                                                    isCorrect: idx === optionIndex
                                                }));
                                                handleQuestionChange(questionIndex, 'options', updatedOptions);
                                            }}
                                        />
                                                                <label className="form-check-label ms-2">
                                                                    {option.isCorrect ? (
                                                                        <span className="text-success">
                                                                            <i className="bi bi-check-circle-fill me-1"></i>
                                        Correct Answer
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            <i className="bi bi-circle me-1"></i>
                                                                            Mark as Correct
                                                                        </span>
                                                                    )}
                                    </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                    </div>
                ))}

                            <div className="form-actions d-flex gap-2 mt-4">
                                <button type="button" className="btn btn-outline-primary" onClick={addQuestion}>
                                    <i className="bi bi-plus-circle me-2"></i>
                        Add Question
                    </button>
                    <button type="submit" className="btn btn-primary">
                                    <i className="bi bi-check-circle me-2"></i>
                        Create Assessment
                    </button>
                </div>
            </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .option-item:hover {
                    background-color: #f8f9fa;
                    border-radius: 0.25rem;
                }
                .form-control:focus {
                    border-color: #80bdff;
                    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
                }
                .card {
                    transition: all 0.3s ease;
                }
                .card:hover {
                    box-shadow: 0 0.5rem 1rem rgba(0,0,0,.15);
                }
                .badge {
                    font-size: 0.9rem;
                    padding: 0.5rem 0.75rem;
                }
                .input-group-text {
                    background-color: #f8f9fa;
                }
                .form-check-input:checked {
                    background-color: #198754;
                    border-color: #198754;
                }
            `}</style>
        </div>
    );
};

export default CreateAssessment; 