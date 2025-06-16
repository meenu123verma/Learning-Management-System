import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService, { ROLES } from '../services/authService';
import Navbar from '../components/Navbar';
import loginIllustration from '../assests/login-illustration.png';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../config';

const Toast = ({ message, type, onClose }) => {
  // type: 'success' or 'danger' (Bootstrap classes)
  // onClose: callback to hide toast
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`toast align-items-center text-white bg-${type} border-0 show`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ minWidth: '250px' }}
    >
      <div className="d-flex">
        <div className="toast-body">{message}</div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' }); // toast state
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const showToast = (message, type = 'danger') => {
    setToast({ show: true, message, type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login form submitted');
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with email:', formData.email);
      
      // Use the login function from AuthContext
      await login(formData.email, formData.password);
      
      // Get the user data from localStorage (set by AuthContext)
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!userData || !userData.role) {
        console.error('Invalid user data after login');
        throw new Error('Invalid user data received after login');
      }

      console.log('Login successful, user data:', {
        userId: userData.userId,
        email: userData.email,
        role: userData.role
      });

      // Show success message
      showToast('Login successful!', 'success');
      
      // Determine the redirect path based on user role
      let redirectPath = '/dashboard';
      if (userData.role === 'Instructor') {
        redirectPath = '/instructor-dashboard';
      } else if (userData.role === 'Student') {
        redirectPath = '/student-dashboard';
      }

      console.log('Attempting to redirect to:', redirectPath);
      
      // Use setTimeout to ensure state updates are complete before navigation
      setTimeout(() => {
        console.log('Executing navigation to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }, 100);

    } catch (err) {
      console.error('Login error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data
        } : 'No response from server'
      });
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (!err.response) {
        errorMessage = `Unable to connect to the server. Please check if the server is running at ${config.API_BASE_URL}`;
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data || 'Invalid email or password';
      } else if (err.response?.status === 404) {
        errorMessage = 'Login service not found. Please contact support.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-gray-900 to-black text-white min-vh-100 d-flex align-items-center position-relative" style={{ paddingTop: '80px' }}>
        <div className="container py-5">
          <div className="row justify-content-center align-items-center">
            {/* Illustration - LEFT side */}
            <div className="col-lg-6 d-none d-lg-flex justify-content-center align-items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <img
                  src={loginIllustration}
                  alt="Login Illustration"
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

            {/* Login Form - RIGHT side */}
            <div className="col-md-8 col-lg-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="card bg-dark border-primary border-opacity-25 shadow-lg p-4 rounded-4"
                
              >
                <h2 className="text-center text-primary mb-4 fw-bold">Welcome Back!</h2>
                <p className="text-center text-secondary mb-4">Sign in to continue your learning journey</p>
                
                <form onSubmit={handleSubmit}>
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
                      placeholder="Enter your password"
                    />
                  </div>
                  <div className="mb-4">
                    <button
                      type="submit"
                      className="btn btn-primary w-100 rounded-pill py-3 d-flex justify-content-center align-items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="spinner-border spinner-border-sm text-light" role="status" aria-hidden="true"></div>
                      ) : (
                        <>
                          <FaLock className="me-2" />
                          Sign In
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p className="text-secondary mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary text-decoration-none fw-bold">
                      Register here
                    </Link>
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

       

        {/* Toast container */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 10500 }}
        >
          {toast.show && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ show: false, message: '', type: '' })}
            />
          )}
        </div>
      </div>

      <style>{`
        .blur-background {
          filter: blur(3px);
          pointer-events: none;
          user-select: none;
          transition: filter 0.3s ease;
        }
        .loading-dots {
          display: inline-flex;
          font-weight: bold;
          font-size: 28px;
          color: black;
        }
        .loading-dots span {
          animation-name: blink;
          animation-duration: 1.4s;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
          margin-left: 2px;
        }
        .loading-dots span:nth-child(1) {
          animation-delay: 0s;
        }
        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%, 20% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
        .form-control:focus {
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
      `}</style>
    </>
  );
};

export default Login;
