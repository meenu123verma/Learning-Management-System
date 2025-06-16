import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const EditAssessment = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [assessment, setAssessment] = useState({
        title: '',
        maxScore: 0,
        questions: []
    });

    useEffect(() => {
        fetchAssessment();
        // eslint-disable-next-line
    }, [assessmentId]);

    const fetchAssessment = async () => {
        try {
            const response = await axiosInstance.get(`/Assessments/${assessmentId}`);
            const data = response.data;

            // Process the data to ensure proper structure
            const processedData = {
                ...data,
                questions: Array.isArray(data.questions)
                    ? data.questions
                    : (data.questions?.$values && Array.isArray(data.questions.$values))
                        ? data.questions.$values
                        : []
            };

            // Process each question's options
            processedData.questions = processedData.questions.map(question => ({
                ...question,
                options: Array.isArray(question.options)
                    ? question.options
                    : (question.options?.$values && Array.isArray(question.options.$values))
                        ? question.options.$values
                        : []
            }));

            setAssessment(processedData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to fetch assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const submissionData = {
                ...assessment,
                questions: assessment.questions.map(question => ({
                    ...question,
                    options: question.options.map(option => ({
                        ...option,
                        questionId: question.questionId
                    }))
                }))
            };
            await axiosInstance.put(`/Assessments/${assessmentId}`, submissionData);
            navigate(-1);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to update assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...assessment.questions];
        updatedQuestions[index] = {
            ...updatedQuestions[index],
            [field]: value
        };
        setAssessment({ ...assessment, questions: updatedQuestions });
    };

    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        const updatedQuestions = [...assessment.questions];
        updatedQuestions[questionIndex].options[optionIndex] = {
            ...updatedQuestions[questionIndex].options[optionIndex],
            [field]: value
        };
        setAssessment({ ...assessment, questions: updatedQuestions });
    };

    const addQuestion = () => {
        const newQuestionId = crypto.randomUUID();
        setAssessment({
            ...assessment,
            questions: [
                ...assessment.questions,
                {
                    questionId: newQuestionId,
                    questionText: '',
                    options: [
                        { optionId: crypto.randomUUID(), text: '', isCorrect: false, questionId: newQuestionId },
                        { optionId: crypto.randomUUID(), text: '', isCorrect: false, questionId: newQuestionId },
                        { optionId: crypto.randomUUID(), text: '', isCorrect: false, questionId: newQuestionId },
                        { optionId: crypto.randomUUID(), text: '', isCorrect: false, questionId: newQuestionId }
                    ]
                }
            ]
        });
    };

    const removeQuestion = (index) => {
        const updatedQuestions = assessment.questions.filter((_, i) => i !== index);
        setAssessment({ ...assessment, questions: updatedQuestions });
    };

    if (loading) {
        return (
            <div className="container-fluid bg-white min-vh-100 py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-dark">Loading assessment...</p>
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

    return (
        <div className="container-fluid bg-white min-vh-100 py-4">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title mb-4">Edit Assessment</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">Assessment Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="title"
                                            value={assessment.title}
                                            onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="maxScore" className="form-label">Maximum Score</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="maxScore"
                                            value={assessment.maxScore}
                                            onChange={(e) => setAssessment({ ...assessment, maxScore: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h4>Questions</h4>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={addQuestion}
                                            >
                                                <i className="bi bi-plus-circle me-2"></i>
                                                Add Question
                                            </button>
                                        </div>

                                        {Array.isArray(assessment.questions) && assessment.questions.map((question, questionIndex) => (
                                            <div key={question.questionId} className="card mb-3">
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <h5 className="card-title">Question {questionIndex + 1}</h5>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => removeQuestion(questionIndex)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label">Question Text</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={question.questionText}
                                                            onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="mb-3">
                                                        <label className="form-label">Options</label>
                                                        {question.options.map((option, optionIndex) => (
                                                            <div key={option.optionId} className="input-group mb-2">
                                                                <div className="input-group-text">
                                                                    <input
                                                                        type="radio"
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
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={option.text}
                                                                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                                                                    placeholder={`Option ${optionIndex + 1}`}
                                                                    required
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate(-1)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditAssessment;