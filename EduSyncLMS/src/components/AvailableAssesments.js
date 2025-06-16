import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import config from '../config';

const AvailabeAssessment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Fetch assessments for the course
        const response = await fetch(
          `${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_COURSE(courseId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assessments");
        }

        const data = await response.json();
        console.log('Raw assessments data:', data);

        // Process the assessments data
        const processedAssessments = Array.isArray(data) ? data :
          (data.$values && Array.isArray(data.$values)) ? data.$values : [];

        console.log('Processed assessments:', processedAssessments);
        setAssessments(processedAssessments);
      } catch (err) {
        console.error("Error fetching assessments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [courseId]);

  const handleDeleteAssessment = async (assessmentId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.DELETE(assessmentId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete assessment");
      }

      setAssessments(
        assessments.filter(
          (assessment) => assessment.assessmentId !== assessmentId
        )
      );
    } catch (err) {
      console.error("Error deleting assessment:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-5" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-5">
      <h3 className="card-title md-4 mb-4">Assessments</h3>
      {assessments.length > 0 ? (
        <div className="row">
          {assessments.map((assessment) => (
            <div key={assessment.assessmentId} className="col-md-4 mb-4">
              <div className="card bg-white font-color h-100">
                <div className="card-body">
                  <h5 className="card-title bold">{assessment.title}</h5>
                  <div className="mb-3">
                    <span className="custom-outline-filled me-2">
                      <i className="bi bi-question-circle me-1"></i>
                      {assessment.questions?.length || 0} Questions
                    </span>
                    <span className="custom-outline-filled">
                      <i className="bi bi-star me-1"></i>
                      Max Score: {assessment.maxScore || 0}
                    </span>
                  </div>
                  <p className="card-text text-muted">
                    Test your knowledge and understanding of the course material.
                  </p>
                </div>
                <div className="card-footer bg-white border-0">
                  {user?.role === "Instructor" ? (
                    <div className="d-flex gap-5">
                      <Link
                        to={`/edit-assessment/${assessment.assessmentId}`}
                        className="custom-outline-filled"
                      >
                        <i className="bi bi-pencil me-2"></i>
                        Edit Assessment
                      </Link>
                      <button
                        className="custom-outline-filled"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this assessment?"
                            )
                          ) {
                            handleDeleteAssessment(assessment.assessmentId);
                          }
                        }}
                      >
                        <i className="bi bi-trash me-2"></i>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={`/assessment/${assessment.assessmentId}`}
                      className="custom-filled w-100"
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Take Assessment
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No assessments available for this course yet.
        </div>
      )}
    </div>
  );
};

export default AvailabeAssessment;
