import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaEdit, FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import config from '../config';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            // Validate passwords if changing password
            if (formData.newPassword) {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('New passwords do not match');
                }
                if (formData.newPassword.length < 6) {
                    throw new Error('New password must be at least 6 characters long');
                }
            }

            const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.USERS.UPDATE_PROFILE}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const updatedUser = await response.json();
            updateUser(updatedUser);
            setSuccess('Profile updated successfully');
            setIsEditing(false);
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getDashboardLink = () => {
        if (!user) return '/dashboard';
        return user.role === 'Instructor' ? '/instructor-dashboard' : '/student-dashboard';
    };

    return (
        <div className="container-fluid bg-white min-vh-100">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="text-dark mb-0">Profile</h2>
                            <Link to={getDashboardLink()} className="btn btn-outline-primary">
                                <FaArrowLeft className="me-2" />
                                Back to Dashboard
                            </Link>
                        </div>

                        <div className="card bg-white shadow-sm">
                            <div className="card-body">
                                <div className="text-center mb-4">
                                    <div className="avatar-circle mb-3">
                                        <span className="avatar-text">{getInitials(user?.name)}</span>
                                    </div>
                                    <h2 className="text-dark mb-0">{user?.name}</h2>
                                    <p className="text-muted">{user?.role}</p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="alert alert-success" role="alert">
                                        {success}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <FaUser className="text-primary me-2" />
                                            <label className="form-label mb-0">Name</label>
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="form-control bg-white"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        ) : (
                                            <p className="form-control-plaintext">{user?.name}</p>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="d-flex align-items-center mb-2">
                                            <FaEnvelope className="text-primary me-2" />
                                            <label className="form-label mb-0">Email</label>
                                        </div>
                                        <p className="form-control-plaintext">{user?.email}</p>
                                    </div>

                                    {isEditing && (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label">Current Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control bg-white"
                                                    name="currentPassword"
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">New Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control bg-white"
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    minLength="6"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="form-label">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control bg-white"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    minLength="6"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="d-flex justify-content-end gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            currentPassword: '',
                                                            newPassword: '',
                                                            confirmPassword: ''
                                                        }));
                                                        setError('');
                                                    }}
                                                >
                                                    <FaTimes className="me-2" />
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    ) : (
                                                        <FaSave className="me-2" />
                                                    )}
                                                    Save Changes
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => setIsEditing(true)}
                                            >
                                                <FaEdit className="me-2" />
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                body {
                    background-color: white !important;
                }
                .container-fluid {
                    background-color: white;
                }
                .avatar-circle {
                    width: 100px;
                    height: 100px;
                    background-color: #0d6efd;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                }
                .avatar-text {
                    color: white;
                    font-size: 2rem;
                    font-weight: bold;
                }
                .form-control-plaintext {
                    padding: 0.375rem 0;
                    margin-bottom: 0;
                    line-height: 1.5;
                    color: #212529;
                    background-color: transparent;
                    border: solid transparent;
                    border-width: 1px 0;
                }
                .card {
                    border: none;
                    border-radius: 0.5rem;
                    background-color: white;
                }
                .btn {
                    padding: 0.5rem 1rem;
                    font-weight: 500;
                }
                .alert {
                    margin-bottom: 1.5rem;
                    background-color: white;
                    border: 1px solid #dee2e6;
                }
                .alert-danger {
                    color: #842029;
                    background-color: #f8d7da;
                    border-color: #f5c2c7;
                }
                .alert-success {
                    color: #0f5132;
                    background-color: #d1e7dd;
                    border-color: #badbcc;
                }
                .btn-outline-primary {
                    color: #0d6efd;
                    border-color: #0d6efd;
                }
                .btn-outline-primary:hover {
                    background-color: #0d6efd;
                    color: white;
                }
                .form-control {
                    background-color: white;
                    border-color: #dee2e6;
                }
                .form-control:focus {
                    background-color: white;
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                .form-label {
                    color: #212529;
                }
                .text-muted {
                    color: #6c757d !important;
                }
            `}</style>
        </div>
    );
};

export default Profile; 