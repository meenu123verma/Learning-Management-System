import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../services/authService';
import Navbar from '../components/Navbar';
import registerIllustration from '../assests/login-illustration.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUser, FaEnvelope, FaLock, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: ROLES.STUDENT
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register(formData.name, formData.email, formData.password, formData.role);
            toast.success('Registration successful!');
            setTimeout(() => {
                navigate(formData.role === ROLES.INSTRUCTOR ? '/instructor-dashboard' : '/student-dashboard');
            }, 1500);
        } catch (err) {
            toast.error(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="bg-gradient-to-b from-gray-900 to-black text-white min-vh-100 d-flex align-items-center position-relative" style={{ paddingTop: '80px' }}>
                <div className="container py-5">
                    <div className="row align-items-center justify-content-center">
                        {/* Illustration */}
                        <div className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                            <img
                                src={registerIllustration}
                                alt="Register Illustration"
                                    className="img-fluid p-3"
                                    style={{
                                        maxHeight: '550px',
                                        borderRadius: '20px',
                                        filter: 'drop-shadow(0 0 15px rgba(0,123,255,0.6))',
                                        transition: 'transform 0.3s ease-in-out',
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Register Form */}
                        <div className="col-md-8 col-lg-5">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="card bg-dark border-primary border-opacity-25 shadow-lg p-4 rounded-4"
                                style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(10, 10, 10, 0.85)' }}
                            >
                                <h2 className="text-center text-primary mb-4 fw-bold">Create Account</h2>
                                <p className="text-center text-secondary mb-4">Join EduSync and start your learning journey</p>
                                
                                    <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="name" className="form-label text-white d-flex align-items-center">
                                            <FaUser className="me-2" />
                                            Full Name
                                        </label>
                                            <input
                                                type="text"
                                            className="form-control bg-dark text-white border-primary border-opacity-25 rounded-pill px-4 py-3"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            placeholder="Enter your full name"
                                            />
                                        </div>
                                    <div className="mb-4">
                                        <label htmlFor="email" className="form-label text-white d-flex align-items-center">
                                            <FaEnvelope className="me-2" />
                                            Email
                                        </label>
                                            <input
                                                type="email"
                                            className="form-control bg-dark text-white border-primary border-opacity-25 rounded-pill px-4 py-3"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            placeholder="Enter your email"
                                            />
                                        </div>
                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label text-white d-flex align-items-center">
                                            <FaLock className="me-2" />
                                            Password
                                        </label>
                                            <input
                                                type="password"
                                            className="form-control bg-dark text-white border-primary border-opacity-25 rounded-pill px-4 py-3"
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            placeholder="Create a password"
                                            />
                                        </div>
                                    <div className="mb-4">
                                        <label htmlFor="role" className="form-label text-white d-flex align-items-center">
                                            {formData.role === ROLES.STUDENT ? <FaUserGraduate className="me-2" /> : <FaChalkboardTeacher className="me-2" />}
                                            I want to join as
                                        </label>
                                            <select
                                            className="form-select bg-dark text-white border-primary border-opacity-25 rounded-pill px-4 py-3"
                                                id="role"
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value={ROLES.STUDENT}>Student</option>
                                                <option value={ROLES.INSTRUCTOR}>Instructor</option>
                                            </select>
                                        </div>
                                    <div className="mb-4">
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100 rounded-pill py-3 d-flex justify-content-center align-items-center gap-2"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="spinner-border spinner-border-sm text-light" role="status" aria-hidden="true"></div>
                                                    <span>Creating Account...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaUser className="me-2" />
                                                    Create Account
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    </form>

                                <div className="text-center">
                                    <p className="text-secondary mb-0">
                                            Already have an account?{' '}
                                        <Link to="/login" className="text-primary text-decoration-none fw-bold">
                                                Login here
                                            </Link>
                                        </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .form-control:focus, .form-select:focus {
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                    border-color: #0d6efd;
                }
                .btn-primary {
                    background: linear-gradient(45deg, #0d6efd, #0a58ca);
                    border: none;
                    transition: all 0.3s ease;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(13, 110, 253, 0.4);
                }
                .form-select {
                    cursor: pointer;
                }
            `}</style>
        </>
    );
};

export default Register;
