import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaUsers, FaStar } from 'react-icons/fa';

const Home = () => {
    const { isAuthenticated } = useAuth();

    return (
        <div className="container-fluid bg-gradient-to-b from-gray-900 to-black text-white min-vh-100" style={{ paddingTop: '80px' }}>
            <div className="container py-5">
                <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="display-4 fw-bold mb-4">
                        <span className="d-block">Welcome to</span>
                        <span className="text-primary">EduSync</span>
                    </h1>
                    <p className="lead text-secondary mb-5">
                        Your all-in-one platform for online learning and assessment.
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                        {!isAuthenticated ? (
                            <Link
                                to="/register"
                                className="btn btn-primary btn-lg px-5 py-3 rounded-pill"
                            >
                                Get started
                            </Link>
                        ) : (
                            <Link
                                to="/courses"
                                className="btn btn-primary btn-lg px-5 py-3 rounded-pill"
                            >
                                View Courses
                            </Link>
                        )}
                    </div>
                    <div className="mt-4 d-flex justify-content-center align-items-center gap-4">
                        <div className="d-flex align-items-center">
                            <FaUsers className="text-primary me-2" />
                            <span>10K+ Students</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <FaStar className="text-warning me-2" />
                            <span>4.8/5 Rating</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <style>{`
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
        </div>
    );
};

export default Home; 