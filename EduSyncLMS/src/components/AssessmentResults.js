import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import './Course.css';

const AssessmentResults = () => {
    const { assessmentId } = useParams();
    const [results, setResults] = useState([]);
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                };

                const [assessmentResponse, resultsResponse] = await Promise.all([
                    axios.get(`${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_ID(assessmentId)}`, { headers }),
                    axios.get(`${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ASSESSMENT(assessmentId)}`, { headers })
                ]);

                // Handle assessment data
                const assessmentData = assessmentResponse.data;
                setAssessment(assessmentData);

                // Handle results data
                const resultsData = resultsResponse.data;
                // Ensure results is an array
                const processedResults = Array.isArray(resultsData) ? resultsData :
                    (resultsData.$values && Array.isArray(resultsData.$values)) ? resultsData.$values :
                    (typeof resultsData === 'object' && resultsData !== null) ? [resultsData] : [];

                setResults(processedResults);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load assessment results. Please try again.');
                setLoading(false);
            }
        };

        fetchData();
    }, [assessmentId]);

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
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

    if (!assessment) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning" role="alert">Assessment not found</div>
            </div>
        );
    }

    const calculateAverageScore = () => {
        if (!Array.isArray(results) || results.length === 0) return 0;
        const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
        return Math.round((totalScore / results.length / assessment.questions.length) * 100);
    };

    return (
        <div className="container mt-5">
            <div className="card bg-white shadow-sm">
                <div className="card-header bg-white border-bottom">
                    <h2 className="text-dark mb-0">Assessment Results: {assessment.title}</h2>
                </div>
                <div className="card-body">
                    <div className="results-summary mb-4">
                        <h3 className="text-dark">Summary</h3>
                        <div className="row">
                            <div className="col-md-6">
                                <p className="text-dark">Total Attempts: {results.length}</p>
                            </div>
                            <div className="col-md-6">
                                <p className="text-dark">Average Score: {calculateAverageScore()}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="results-list">
                        <h3 className="text-dark mb-3">Student Results</h3>
                        {results.length === 0 ? (
                            <div className="alert alert-info">No results available for this assessment.</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Score</th>
                                            <th>Percentage</th>
                                            <th>Attempt Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map(result => (
                                            <tr key={result.resultId}>
                                                <td>{result.userName || 'Unknown Student'}</td>
                                                <td>{result.score} / {assessment.questions.length}</td>
                                                <td>{Math.round((result.score / assessment.questions.length) * 100)}%</td>
                                                <td>{new Date(result.attemptDate).toLocaleString()}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => window.location.href = `/results/${result.resultId}`}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .card {
                    border: none;
                    border-radius: 0.5rem;
                }
                .table {
                    margin-bottom: 0;
                }
                .table th {
                    font-weight: 600;
                    color: #495057;
                }
                .table td {
                    vertical-align: middle;
                }
                .btn-sm {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.875rem;
                }
                .alert {
                    margin-bottom: 0;
                }
            `}</style>
        </div>
    );
};

export default AssessmentResults; 