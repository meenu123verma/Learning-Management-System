import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import config from "../config";

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1050,
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "300px",
          maxWidth: "30%",
          boxShadow: "0 5px 15px rgba(0,0,0,.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5>{title}</h5>
        <div>{children}</div>
        <div className="text-end mt-3">
          <button className="custom-filled" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const Assessment = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [assessment, setAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [violationCount, setViolationCount] = useState(0);
    const hasSubmittedRef = useRef(false);
    // Safe assignment of questions
    const questions = assessment?.questions || [];

    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter(
        (val) => val !== null
    ).length;
    const progressPercent = totalQuestions
        ? Math.round((answeredCount / totalQuestions) * 100)
        : 0;

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No authentication token found");

                const response = await fetch(
                    `${config.API_BASE_URL}${config.API_ENDPOINTS.ASSESSMENTS.GET_BY_ID(
                        assessmentId
                    )}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch assessment");

                const data = await response.json();
                const assessmentData = data.$values ? data.$values[0] : data;

                if (assessmentData.questions?.$values) {
                    assessmentData.questions = assessmentData.questions.$values;
                }

                setAssessment(assessmentData);
                
                const initialAnswers = {};
                assessmentData.questions.forEach((q) => {
                    initialAnswers[q.questionId] = null;
                });
                setAnswers(initialAnswers);
            } catch (err) {
                console.error("Error fetching assessment:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [assessmentId]);

    useEffect(() => {
        if (assessment && assessment.questions) {
            const perQuestionTimeSeconds = 60;
            const totalTime = assessment.questions.length * perQuestionTimeSeconds;
            setTimeLeft(totalTime);
        }
    }, [assessment]);

    useEffect(() => {
        // Don't trigger if still loading or already submitted
        if (loading || submitted) return;

        // Only trigger time-up if timeLeft is a positive number that reached zero naturally
        if (timeLeft <= 0 && timeLeft !== null) {
            setModalMessage(
                "Time is up! Your assessment will be submitted automatically."
            );
            setModalVisible(true);
            return;
        }

        // Start timer only if timeLeft > 0
        if (timeLeft > 0) {
            const timerId = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timerId);
        }
    }, [timeLeft, loading, submitted]);

    const handleAnswerSelect = (questionId, optionId) => {
        if (submitted || timeLeft <= 0) return;
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const clearResponse = (questionId) => {
        if (submitted || timeLeft <= 0) return;
        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [questionId]: null,
        }));
    };

    const handleSubmit = async () => {
        // Hide modal first
        setModalVisible(false);
        if (hasSubmittedRef.current) return; // Prevent double submission
        hasSubmittedRef.current = true;

        setSubmitted(true);
        console.log("Assessment submitted.");

        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authentication token found");

            const unanswered = Object.entries(answers).filter(([_, v]) => v === null);
            if (unanswered.length > 0) {
                setModalMessage("Please answer all questions before submitting.");
                setModalVisible(true);
                return;
            }

            const submission = {
                assessmentId: assessment.assessmentId,
                userId: user.userId,
                answers: Object.entries(answers).map(
                    ([questionId, selectedOptionId]) => ({
                        questionId,
                        selectedOptionId,
                    })
                ),
            };

            const response = await fetch(
                `${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.SUBMIT}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(submission),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to submit assessment: ${errorText}`);
            }

            const resultData = await response.json();

            const storedResults = JSON.parse(
                localStorage.getItem(`results_${assessment.assessmentId}`) || "[]"
            );
            storedResults.push(resultData.resultId);
            localStorage.setItem(
                `results_${assessment.assessmentId}`,
                JSON.stringify(storedResults)
            );

            setResult(resultData);
            setSubmitted(true);
        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.message);
        }
    };

    //   Tab switching and focus loss detection
    useEffect(() => {
        const handleViolation = (message) => {
            let newCount = violationCount + 1;
            setViolationCount(newCount);

            if (newCount >= 3) {
                setModalMessage(
                    "Multiple violations detected. Your assessment is being submitted."
                );
                setModalVisible(true);
                handleSubmit();
            } else {
                setModalMessage(`${message} (Warning ${newCount} of 3)`);
                setModalVisible(true);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation("Tab switching is not allowed during the assessment.");
            }
        };

        const handleBlur = () => {
            handleViolation("Focus lost! Please stay on the assessment tab.");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [violationCount]);

    // When modal closes after "time is up", submit automatically
    useEffect(() => {
        if (!modalVisible && modalMessage.includes("Time is up")) {
            // After user clicks OK on modal, submit the assessment automatically
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalVisible]);

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
            <div className="container mt-5">
                <div className="alert alert-danger">{error}</div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning">Assessment not found</div>
            </div>
        );
    }

    if (submitted && result) {
        return (
            <div className="create-assessment-container container mt-5 text-center border shadow font font-color">
                <div className="p-4">
                    <h2>Assessment Results</h2>
                    <h3>
                        Score: {result.score} / {totalQuestions}
                    </h3>
                    <p className="text-muted">
                        Percentage: {Math.round((result.score / totalQuestions) * 100)}%
                    </p>
                    <p>You can see your Detailed Assessment Result on the Dashboard</p>

                    <button className="custom-filled mt-3" onClick={() => navigate(-1)}>
                        Back to Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="create-assessment-container container mt-5 font font-color shadow">
                <div className="mb-4">
                    <div className="d-flex justify-content-between">
                        <span className="text-muted bold">
                            {answeredCount} of {totalQuestions} answered
                        </span>
                        {timeLeft !== null && (
                            <div
                                style={{
                                    fontWeight: "bold",
                                    fontSize: "1.2rem",
                                    color: timeLeft <= 30 ? "red" : "#332D56",
                                }}
                            >
                                Time Left:{" "}
                                {Math.floor(timeLeft / 60)
                                    .toString()
                                    .padStart(2, "0")}
                                :{(timeLeft % 60).toString().padStart(2, "0")}
                            </div>
                        )}
                    </div>

                    <div
                        className="progress mt-2"
                        style={{
                            height: "15px",
                            borderRadius: "12px",
                        }}
                    >
                        <div
                            className="progress-bar"
                            style={{
                                width: `${progressPercent}%`,
                                backgroundColor: "#332D56",
                            }}
                            role="progressbar"
                            aria-valuenow={progressPercent}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        >
                            {progressPercent}%
                        </div>
                    </div>

                    {/* <div className="mb-3 text-end fs-5 fw-bold font-monospace">
                        Time Left:{" "}
                        {Math.floor(timeLeft / 60)
                            .toString()
                            .padStart(2, "0")}
                        :{(timeLeft % 60).toString().padStart(2, "0")}
                    </div> */}
                </div>

                <div className="card-body">
                    <h2 className="card-title mb-4"> Assessment : {assessment.title}</h2>
                    <p className="font font-color mb-4" style={{ fontSize: "1.1rem" }}>
                        Total Questions: {questions.length} | Maximum Score:{" "}
                        {assessment.maxScore}
                    </p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="container py-4"
                    >
                        {questions.map((question, index) => (
                            <div key={question.questionId} className="mb-5">
                                <h5 className="mb-3 fw-semibold">
                                    Q{index + 1}: {question.questionText}
                                </h5>
                                <div className="d-flex flex-column gap-2">
                                    {(question.options?.$values || question.options || []).map(
                                        (option) => {
                                            const inputId = `q${question.questionId}-o${option.optionId}`;
                                            const isSelected =
                                                answers[question.questionId] === option.optionId;

                                            return (
                                                <label 
                                                    key={option.optionId}
                                                    htmlFor={inputId}
                                                    className={`form-control custom-input no-focus-shadow p-3 rounded-3 ${
                                                        isSelected ? "border-dark" : "bg-white"
                                                    } d-flex align-items-center cursor-pointer`}
                                                    style={{
                                                        cursor:
                                                            submitted || timeLeft <= 0
                                                                ? "not-allowed"
                                                                : "pointer",
                                                    }}
                                                >
                                                    <input
                                                        className="me-3"
                                                        type="radio"
                                                        name={`question-${question.questionId}`}
                                                        id={inputId}
                                                        value={option.optionId}
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            handleAnswerSelect(
                                                                question.questionId,
                                                                option.optionId
                                                            )
                                                        }
                                                        disabled={submitted || timeLeft <= 0}
                                                        style={{
                                                            cursor:
                                                                submitted || timeLeft <= 0
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                        }}
                                                    />
                                                    <span className="form-check-label">
                                                        {option.text}
                                                    </span>
                                                </label>
                                            );
                                        }
                                    )}
                                </div>
                                <div className="text-end">
                                    <button
                                        type="button"
                                        className="custom-outline-filled mt-4"
                                        style={{
                                            width: "140px",
                                            height: "40px",
                                            cursor:
                                                submitted || timeLeft <= 0 ? "not-allowed" : "pointer",
                                        }}
                                        onClick={() => clearResponse(question.questionId)}
                                        disabled={submitted || timeLeft <= 0}
                                    >
                                        Clear Response
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="d-grid gap-2">
                            <button 
                                type="submit" 
                                className="custom-filled"
                                disabled={submitted || timeLeft <= 0}
                            >
                                Submit Assessment
                            </button>
                            <button 
                                type="button" 
                                className="custom-outline"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Modal
                show={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Notice"
            >
                <p>{modalMessage}</p>
            </Modal>
        </>
    );
};

export default Assessment; 
