// import React, { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { FaArrowLeft } from 'react-icons/fa';
// import config from '../config';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const AssessmentResultDetails = () => {
//     const { resultId } = useParams();
//     const [result, setResult] = useState(null);
//     const [assessment, setAssessment] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const fetchResultDetails = async () => {
//             try {
//                 const token = localStorage.getItem('token');
//                 if (!token) throw new Error('No authentication token found');

//                 // Fetch result details
//                 const resultResponse = await fetch(
//                     `${config.API_BASE_URL}/api/Results/${resultId}`,
//                     {
//                         headers: {
//                             'Authorization': `Bearer ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     }
//                 );
//                 if (!resultResponse.ok) throw new Error('Failed to fetch result details');
//                 const resultData = await resultResponse.json();
//                 console.log('Raw Result Data:', resultData);
                
//                 // Process student answers
//                 const processedResult = {
//                     ...resultData,
//                     studentAnswers: Array.isArray(resultData.studentAnswers) ? resultData.studentAnswers :
//                                   (resultData.studentAnswers?.$values && Array.isArray(resultData.studentAnswers.$values)) ? 
//                                   resultData.studentAnswers.$values : []
//                 };
//                 console.log('Processed Student Answers:', processedResult.studentAnswers);
//                 setResult(processedResult);

//                 // Fetch assessment details
//                 const assessmentResponse = await fetch(
//                     `${config.API_BASE_URL}/api/Assessments/${resultData.assessmentId}`,
//                     {
//                         headers: {
//                             'Authorization': `Bearer ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     }
//                 );
//                 if (!assessmentResponse.ok) throw new Error('Failed to fetch assessment details');
//                 const assessmentData = await assessmentResponse.json();
//                 console.log('Raw Assessment Data:', assessmentData);
                
//                 // Process questions
//                 const processedQuestions = Array.isArray(assessmentData.questions) ? assessmentData.questions :
//                                         (assessmentData.questions?.$values && Array.isArray(assessmentData.questions.$values)) ? 
//                                         assessmentData.questions.$values : [];

//                 console.log('Processed Questions:', processedQuestions);

//                 // Process each question with its options and answers
//                 const questionsWithDetails = processedQuestions.map(question => {
//                     // Get options from the question object
//                     const options = Array.isArray(question.options) ? question.options :
//                                   (question.options?.$values && Array.isArray(question.options.$values)) ? 
//                                   question.options.$values : [];

//                     // Find the correct option
//                     const correctOption = options.find(opt => opt.optionId === question.correctOptionId);

//                     // Find the user's answer for this question
//                     const userAnswer = processedResult.studentAnswers.find(
//                         ans => ans.questionId === question.questionId
//                     );

//                     // Find the user's selected option
//                     const userSelectedOption = userAnswer ? 
//                         options.find(opt => opt.optionId === userAnswer.selectedOptionId) : null;

//                     // Check if the answer is correct
//                     const isCorrect = userAnswer ? userAnswer.selectedOptionId === question.correctOptionId : false;

//                     console.log(`Question ${question.questionId} Details:`, {
//                         options,
//                         correctOption,
//                         userAnswer,
//                         userSelectedOption,
//                         isCorrect
//                     });

//                     console.log('User Selected Option:', userSelectedOption);
//                     console.log('Correct Option:', correctOption);
//                     console.log('Correct Option ID:', question.correctOptionId);
//                     console.log('User Selected Option ID:', userAnswer ? userAnswer.selectedOptionId : 'No user answer');

//                     return {
//                         ...question,
//                         options,
//                         correctOption,
//                         userSelectedOption,
//                         isCorrect
//                     };
//                 });

//                 const processedAssessment = {
//                     ...assessmentData,
//                     questions: questionsWithDetails
//                 };

//                 console.log('Final Processed Assessment:', processedAssessment);
//                 setAssessment(processedAssessment);
//             } catch (err) {
//                 console.error('Error in fetchResultDetails:', err);
//                 setError(err.message);
//                 toast.error(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchResultDetails();
//     }, [resultId]);

//     if (loading) {
//         return (
//             <div className="container-fluid bg-white min-vh-100">
//                 <div className="container mt-5">
//                     <div className="text-center">
//                         <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
//                             <span className="visually-hidden">Loading...</span>
//                         </div>
//                         <p className="mt-3 text-dark">Loading assessment details...</p>
//                     </div>
//                 </div>
//                 <ToastContainer position="top-right" autoClose={5000} />
//             </div>
//         );
//     }

//     if (!result || !assessment || !Array.isArray(assessment.questions)) {
//         return (
//             <div className="container-fluid bg-white min-vh-100">
//                 <div className="container mt-5">
//                     <div className="alert alert-info" role="alert">
//                         No data found.
//                     </div>
//                 </div>
//                 <ToastContainer position="top-right" autoClose={5000} />
//             </div>
//         );
//     }

//     return (
//         <div className="container-fluid bg-white min-vh-100 py-5">
//             <ToastContainer position="top-right" autoClose={5000} />
//             <div className="container">
//                 <div className="d-flex justify-content-between align-items-center mb-4">
//                     <h2 className="text-dark mb-0">{assessment.title}</h2>
//                     <Link to="/all-results" className="btn btn-outline-primary">
//                         <FaArrowLeft className="me-2" />
//                         Back to Results
//                     </Link>
//                 </div>

//                 <div className="card mb-4">
//                     <div className="card-body">
//                         <h4 className="card-title text-dark">Result Summary</h4>
//                         <div className="row">
//                             <div className="col-md-6">
//                                 <p className="mb-2">
//                                     <strong>Score:</strong> {result.score} / {assessment.questions.length}
//                                 </p>
//                                 <p className="mb-2">
//                                     <strong>Percentage:</strong>{' '}
//                                     {Math.round((result.score / assessment.questions.length) * 100)}%
//                                 </p>
//                             </div>
//                             <div className="col-md-6">
//                                 <p className="mb-2">
//                                     <strong>Attempted on:</strong>{' '}
//                                     {new Date(result.attemptDate).toLocaleString()}
//                                 </p>
//                                 <p className="mb-2">
//                                     <strong>Total Questions:</strong>{' '}
//                                     {assessment.questions.length}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 <h3 className="text-dark mb-4">Question Details</h3>
//                 {assessment.questions.map((question, idx) => {
//                     console.log(`Rendering Question ${idx + 1}:`, question);
//                     return (
//                         <div key={question.questionId} className="card mb-4">
//                             <div className="card-body">
//                                 <div className="d-flex justify-content-between align-items-start mb-3">
//                                     <h5 className="card-title text-dark mb-0">
//                                         Question {idx + 1} of {assessment.questions.length}
//                                     </h5>
//                                 </div>
//                                 <p className="card-text text-dark mb-4 fs-5">
//                                     {question.questionText}
//                                 </p>
//                                 <div className="options mb-4">
//                                     {question.options && question.options.map((option) => {
//                                         const isUserSelected = question.userSelectedOption && question.userSelectedOption.optionId === option.optionId;
//                                         const isCorrectOption = question.correctOption && question.correctOption.optionId === option.optionId;
//                                         let optionClass = 'list-group-item mb-2 rounded-3';
                                        
//                                         if (isUserSelected && isCorrectOption) {
//                                             optionClass += ' bg-success bg-opacity-10 border-success';
//                                         } else if (isUserSelected && !isCorrectOption) {
//                                             optionClass += ' bg-danger bg-opacity-10 border-danger';
//                                         } else if (isCorrectOption) {
//                                             optionClass += ' border-success';
//                                         }

//                                         return (
//                                             <div key={option.optionId} className={optionClass}>
//                                                 <div className="d-flex align-items-center p-2">
//                                                     <div className="me-3">
//                                                         {isCorrectOption && (
//                                                             <i className="bi bi-check-circle-fill text-success fs-5"></i>
//                                                         )}
//                                                     </div>
//                                                     <div className="flex-grow-1">
//                                                         <p className="mb-0 fs-6">
//                                                             {option.text}
//                                                             {isUserSelected && (
//                                                                 <span className="ms-2 text-muted">(Your Answer)</span>
//                                                             )}
//                                                         </p>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                                 {!question.isCorrect && (
//                                     <div className="alert alert-info mt-3">
//                                         <i className="bi bi-info-circle me-2"></i>
//                                         <strong>Explanation:</strong> The correct answer was marked with a green checkmark.
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     );
//                 })}

//                 <style jsx>{`
//                     .options .list-group-item {
//                         transition: all 0.3s ease;
//                     }
//                     .options .list-group-item:hover {
//                         transform: translateX(5px);
//                     }
//                     .badge {
//                         font-size: 0.9rem;
//                         padding: 0.5rem 1rem;
//                     }
//                 `}</style>
//             </div>
//         </div>
//     );
// };

// export default AssessmentResultDetails; 

// // import React, { useState, useEffect } from "react";
// // import { useParams } from "react-router-dom";
// // import axios from "axios";
// // import config from "../config";
// // import "./Course.css";

// // const ViewAssessmentResult = () => {
// //   const { resultId } = useParams();
// //   const [result, setResult] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     const fetchResult = async () => {
// //       try {
// //         const token = localStorage.getItem("token");
// //         if (!token) {
// //           throw new Error("No authentication token found");
// //         }

// //         const response = await axios.get(
// //           `${config.API_BASE_URL}${config.API_ENDPOINTS.RESULTS.GET_BY_ID(
// //             resultId
// //           )}`,
// //           {
// //             headers: {
// //               Authorization: `Bearer ${token}`,
// //               "Content-Type": "application/json",
// //               Accept: "application/json",
// //             },
// //           }
// //         );
// //         setResult(response.data);
// //         setLoading(false);
// //       } catch (error) {
// //         console.error("Error fetching result:", error);
// //         setError("Failed to load result. Please try again.");
// //         setLoading(false);
// //       }
// //     };

// //     fetchResult();
// //   }, [resultId]);

// //   if (loading) return <div>Loading result...</div>;
// //   if (error) return <div className="error-message">{error}</div>;
// //   if (!result) return <div>Result not found</div>;

// //   // Ensure we have answers to display
// //   const answers = result.answers || [];

// //   return (
// //     <div className="result-container shadow">
// //       <h2 className="font-color font">Assessment Result</h2>
// //       <div className="result-summary font-color font card">
// //         <p>
// //           Score: {result.score} out of {answers.length}
// //         </p>
// //         <p>
// //           Percentage:{" "}
// //           {Math.round(
// //             (result.score / ViewAssessmentResult.questions.length) * 100
// //           )}
// //           %
// //         </p>
// //         <p>Attempt Date: {new Date(result.attemptDate).toLocaleString()}</p>
// //       </div>

// //       <div className="answers-review font-color font">
// //         <h3>Your Answers</h3>
// //         {answers.length > 0 ? (
// //           answers.map((answer, index) => (
// //             <div
// //               key={index}
// //               className={`answer-container ${
// //                 answer.isCorrect ? "correct" : "incorrect"
// //               }`}
// //             >
// //               <h4>Question {index + 1}</h4>
// //               <p>{answer.questionText}</p>
// //               <div className="selected-answer">
// //                 <p>Your Answer: {answer.selectedOptionText}</p>
// //                 {!answer.isCorrect && answer.allOptions && (
// //                   <p className="correct-answer">
// //                     Correct Answer:{" "}
// //                     {answer.allOptions.find((opt) => opt.isCorrect)?.text}
// //                   </p>
// //                 )}
// //               </div>
// //             </div>
// //           ))
// //         ) : (
// //           <div className="alert alert-info">
// //             No detailed answer information available.
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default ViewAssessmentResult;

// import React, { useState, useEffect } from "react";
// import { useParams, Link } from "react-router-dom";
// import { FaArrowLeft } from "react-icons/fa";
// import config from "../config";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const ViewAssessmentResult = () => {
//   const { resultId } = useParams();
//   const [result, setResult] = useState(null);
//   const [assessment, setAssessment] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchResultDetails = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("No authentication token found");

//         // Fetch result details
//         const resultResponse = await fetch(
//           `${config.API_BASE_URL}/api/Results/${resultId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         if (!resultResponse.ok)
//           throw new Error("Failed to fetch result details");
//         const resultData = await resultResponse.json();
//         console.log("Raw Result Data:", resultData);

//         // Process student answers
//         const processedResult = {
//           ...resultData,
//           studentAnswers: Array.isArray(resultData.studentAnswers)
//             ? resultData.studentAnswers
//             : resultData.studentAnswers?.$values &&
//               Array.isArray(resultData.studentAnswers.$values)
//             ? resultData.studentAnswers.$values
//             : [],
//         };
//         console.log(
//           "Processed Student Answers:",
//           processedResult.studentAnswers
//         );
//         setResult(processedResult);

//         // Fetch assessment details
//         const assessmentResponse = await fetch(
//           `${config.API_BASE_URL}/api/Assessments/${resultData.assessmentId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         if (!assessmentResponse.ok)
//           throw new Error("Failed to fetch assessment details");
//         const assessmentData = await assessmentResponse.json();
//         console.log("Raw Assessment Data:", assessmentData);

//         // Process questions
//         const processedQuestions = Array.isArray(assessmentData.questions)
//           ? assessmentData.questions
//           : assessmentData.questions?.$values &&
//             Array.isArray(assessmentData.questions.$values)
//           ? assessmentData.questions.$values
//           : [];

//         console.log("Processed Questions:", processedQuestions);

//         // Process each question with its options and answers
//         const questionsWithDetails = processedQuestions.map((question) => {
//           // Get options from the question object
//           const options = Array.isArray(question.options)
//             ? question.options
//             : question.options?.$values &&
//               Array.isArray(question.options.$values)
//             ? question.options.$values
//             : [];

//           // Find the correct option
//           const correctOption = options.find(
//             (opt) => opt.optionId === question.correctOptionId
//           );

//           // Find the user's answer for this question
//           const userAnswer = processedResult.studentAnswers.find(
//             (ans) => ans.questionId === question.questionId
//           );

//           // Find the user's selected option
//           const userSelectedOption = userAnswer
//             ? options.find(
//                 (opt) => opt.optionId === userAnswer.selectedOptionId
//               )
//             : null;

//           // Check if the answer is correct
//           const isCorrect = userAnswer
//             ? userAnswer.selectedOptionId === question.correctOptionId
//             : false;

//           console.log(`Question ${question.questionId} Details:`, {
//             options,
//             correctOption,
//             userAnswer,
//             userSelectedOption,
//             isCorrect,
//           });

//           console.log("User Selected Option:", userSelectedOption);
//           console.log("Correct Option:", correctOption);
//           console.log("Correct Option ID:", question.correctOptionId);
//           console.log(
//             "User Selected Option ID:",
//             userAnswer ? userAnswer.selectedOptionId : "No user answer"
//           );

//           return {
//             ...question,
//             options,
//             correctOption,
//             userSelectedOption,
//             isCorrect,
//           };
//         });

//         const processedAssessment = {
//           ...assessmentData,
//           questions: questionsWithDetails,
//         };

//         console.log("Final Processed Assessment:", processedAssessment);
//         setAssessment(processedAssessment);
//       } catch (err) {
//         console.error("Error in fetchResultDetails:", err);
//         setError(err.message);
//         toast.error(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchResultDetails();
//   }, [resultId]);

//   if (loading) {
//     return (
//       <div className="container-fluid bg-white min-vh-100">
//         <div className="container mt-5">
//           <div className="text-center">
//             <div
//               className="spinner-border text-primary"
//               role="status"
//               style={{ width: "3rem", height: "3rem" }}
//             >
//               <span className="visually-hidden">Loading...</span>
//             </div>
//             <p className="mt-3 text-dark">Loading assessment details...</p>
//           </div>
//         </div>
//         <ToastContainer position="top-right" autoClose={5000} />
//       </div>
//     );
//   }

//   if (!result || !assessment || !Array.isArray(assessment.questions)) {
//     return (
//       <div className="container-fluid bg-white min-vh-100">
//         <div className="container mt-5">
//           <div className="alert alert-info" role="alert">
//             No data found.
//           </div>
//         </div>
//         <ToastContainer position="top-right" autoClose={5000} />
//       </div>
//     );
//   }

//   return (
//     <div className="container-fluid bg-white min-vh-100 py-5">
//       <ToastContainer position="top-right" autoClose={5000} />
//       <div className="container">
//         <div className="d-flex justify-content-between align-items-center mb-4">
//           <h2 className="text-dark mb-0">{assessment.title}</h2>
//           <Link to="/all-results" className="btn btn-outline-primary">
//             <FaArrowLeft className="me-2" />
//             Back to Results
//           </Link>
//         </div>

//         <div className="card mb-4">
//           <div className="card-body">
//             <h4 className="card-title text-dark">Result Summary</h4>
//             <div className="row">
//               <div className="col-md-6">
//                 <p className="mb-2">
//                   <strong>Score:</strong> {result.score} /{" "}
//                   {assessment.questions.length}
//                 </p>
//                 <p className="mb-2">
//                   <strong>Percentage:</strong>{" "}
//                   {Math.round(
//                     (result.score / assessment.questions.length) * 100
//                   )}
//                   %
//                 </p>
//               </div>
//               <div className="col-md-6">
//                 <p className="mb-2">
//                   <strong>Attempted on:</strong>{" "}
//                   {new Date(result.attemptDate).toLocaleString()}
//                 </p>
//                 <p className="mb-2">
//                   <strong>Total Questions:</strong>{" "}
//                   {assessment.questions.length}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//                 <h3 className="text-dark mb-4 bold">Question Details</h3>
        // {result.questions.map((question, idx) => {
        //     // Ensure we have options to display
        //     const options = question.allOptions?.$values || [];
  
        //     return (
        //       <div
        //         key={`question-${question.questionId || idx}`}
        //         className="card mb-4"
        //       >
        //         <div className="card-body">
        //           <div className="d-flex justify-content-between align-items-start mb-3">
        //             <h5 className="card-title text-dark mb-0 bold">
        //               Question {idx + 1} of {result.maxScore}
        //             </h5>
        //             <span
        //               className={`d-inline-flex align-items-center gap-2 px-3 py-1 fw-semibold text-white ${
        //                 question.isCorrect ? "bg-success" : "bg-danger"
        //               }`}
        //               style={{
        //                 fontSize: "0.9rem",
        //                 boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        //                 transition: "background-color 0.3s ease-in-out",
        //                 borderRadius: "12px",
        //               }}
        //             >
        //               <i
        //                 className={`bi ${
        //                   question.isCorrect
        //                     ? "bi-check-circle-fill"
        //                     : "bi-x-circle-fill"
        //                 }`}
        //                 style={{ fontSize: "1rem" }}
        //               ></i>
        //               {question.isCorrect ? "Correct" : "Incorrect"}
        //             </span>
        //           </div>
        //           <p className="card-text bold mb-4 fs-5">
        //             {question.questionText}
        //           </p>
        //           <div className="options mb-4">
        //             {options.map((option, optionIdx) => {
        //               const isSelected =
        //                 option.optionId ===
        //                 question.studentAnswer?.selectedOptionId;
        //               const isCorrect =
        //                 option.optionId === question.correctOption?.optionId;
  
        //               let optionClass =
        //                 " mb-2 rounded-3 p-3 form-control custom-input no-focus-shadow";
        //               if (isSelected && isCorrect) {
        //                 optionClass += " bg-success bg-opacity-10 border-success";
        //               } else if (isSelected && !isCorrect) {
        //                 optionClass += " bg-danger bg-opacity-10 border-danger";
        //               } else if (isCorrect) {
        //                 optionClass += " border-success";
        //               }
  
        //               return (
        //                 <div
        //                   key={`question-${question.questionId || idx}-option-${
        //                     option.optionId || optionIdx
        //                   }`}
        //                   className={optionClass}
        //                 >
        //                   <div className="d-flex align-items-center">
        //                     <div className="me-3">
        //                       {isCorrect && (
        //                         <i className="bi bi-check-circle-fill text-success fs-5"></i>
        //                       )}
        //                       {isSelected && !isCorrect && (
        //                         <i className="bi bi-x-circle-fill text-danger fs-5"></i>
        //                       )}
        //                     </div>
        //                     <div className="flex-grow-1">
        //                       <p className="mb-0 fs-6">
        //                         {option.text}
        //                         {isSelected && (
        //                           <span className="ms-2 text-muted">
        //                             (Your Answer)
        //                           </span>
        //                         )}
        //                         {!isSelected && isCorrect && (
        //                           <span className="ms-2 text-success fw-semibold">
        //                             (Correct Answer)
        //                           </span>
        //                         )}
        //                       </p>
        //                     </div>
        //                   </div>
        //                 </div>
        //               );
        //             })}
        //           </div>
//           );
//         })}

//         <style jsx>{`
//           .options .list-group-item {
//             transition: all 0.3s ease;
//           }
//           .options .list-group-item:hover {
//             transform: translateX(5px);
//           }
//           .badge {
//             font-size: 0.9rem;
//             padding: 0.5rem 1rem;
//           }
//         `}</style>
//       </div>
//     </div>
//   );
// };

// export default ViewAssessmentResult;

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import config from "../config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ViewAssessmentResult = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResultDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        // First fetch basic result info
        const resultResponse = await fetch(
          `${config.API_BASE_URL}/api/Results/${resultId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!resultResponse.ok)
          throw new Error("Failed to fetch result details");
        const basicResult = await resultResponse.json();
        console.log("Basic result:", basicResult);

        // Then fetch detailed result with student answers
        const detailedResponse = await fetch(
          `${config.API_BASE_URL}/api/Results/student/${basicResult.userId}/assessment/${basicResult.assessmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!detailedResponse.ok)
          throw new Error("Failed to fetch detailed result");
        const detailedResult = await detailedResponse.json();
        console.log(
          "Detailed result structure:",
          JSON.stringify(detailedResult, null, 2)
        );

        // Process the response to ensure proper structure
        const processedResult = {
          ...detailedResult,
          questions: Array.isArray(detailedResult.questions)
            ? detailedResult.questions
            : detailedResult.questions?.$values || [],
        };

        // Fetch all attempts for this assessment
        const attemptsResponse = await fetch(
          `${config.API_BASE_URL}/api/Results/assessment/${basicResult.assessmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json();
          const attempts = Array.isArray(attemptsData)
            ? attemptsData
            : attemptsData.$values || [];

          // Filter attempts for the current user and sort by date
          const userAttempts = attempts
            .filter((attempt) => attempt.userId === basicResult.userId)
            .sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));

          setAllAttempts(userAttempts);
        }

        console.log("Processed result:", processedResult);
        setResult(processedResult);
      } catch (err) {
        console.error("Error in fetchResultDetails:", err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResultDetails();
  }, [resultId]);

  if (loading) {
    return (
      <div className="container-fluid bg-white min-vh-100">
        <div className="container mt-5">
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-dark">Loading assessment details...</p>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    );
  }

  if (!result || !result.questions || result.questions.length === 0) {
    return (
      <div className="container-fluid bg-white min-vh-100">
        <div className="container mt-5">
          <div className="alert alert-info" role="alert">
            No question data found for this assessment.
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    );
  }
  return (
    <div className="container-fluid bg-white min-vh-100 py-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 fw-bold">{result.assessmentTitle}</h2>
          <Link to="/all-results" className="btn btn-outline-primary">
            <FaArrowLeft className="me-2" />
            Back to Results
          </Link>
        </div>
  
        <div className="card mb-4">
          <div className="card-body">
            <h4 className="card-title fw-bold">Result Summary:</h4>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Score:</strong> {result.score} / {result.maxScore}
                </p>
                <p className="mb-2">
                  <strong>Percentage:</strong>{" "}
                  {Math.round((result.score / result.maxScore) * 100)}%
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-2">
                  <strong>Attempted on:</strong>{" "}
                  {new Date(result.attemptDate).toLocaleString()}
                </p>
                <p className="mb-2">
                  <strong>Total Questions:</strong> {result.maxScore}
                </p>
              </div>
            </div>
          </div>
        </div>
  
        <h3 className="text-dark mb-4 fw-bold">Question Details</h3>
        {result.questions.map((question, idx) => {
          const options = question.allOptions?.$values || [];
  
          return (
            <div
              key={`question-${question.questionId || idx}`}
              className="card mb-4"
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title fw-bold mb-0 text-dark">
                    Question {idx + 1} of {result.maxScore}
                  </h5>
                  <span
                    className={`badge ${
                      question.isCorrect ? "bg-success" : "bg-danger"
                    } text-white px-3 py-2 rounded-pill`}
                    style={{
                      fontSize: "0.9rem",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                  >
                    <i
                      className={`bi ${
                        question.isCorrect
                          ? "bi-check-circle-fill"
                          : "bi-x-circle-fill"
                      } me-1`}
                    ></i>
                    {question.isCorrect ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <p className="fs-5 fw-bold">{question.questionText}</p>
  
                <div className="options">
                  {options.map((option, optionIdx) => {
                    const isSelected =
                      option.optionId ===
                      question.studentAnswer?.selectedOptionId;
                    const isCorrect =
                      option.optionId === question.correctOption?.optionId;
  
                    let optionClass =
                      "p-3 mb-2 border rounded bg-white"; // base class
                    if (isSelected && isCorrect) {
                      optionClass += " border-success bg-success bg-opacity-10";
                    } else if (isSelected && !isCorrect) {
                      optionClass += " border-danger bg-danger bg-opacity-10";
                    } else if (isCorrect) {
                      optionClass += " border-success";
                    }
  
                    return (
                      <div
                        key={`question-${question.questionId || idx}-option-${
                          option.optionId || optionIdx
                        }`}
                        className={optionClass}
                      >
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            {isCorrect && (
                              <i className="bi bi-check-circle-fill text-success fs-5"></i>
                            )}
                            {isSelected && !isCorrect && (
                              <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                            )}
                          </div>
                          <div>
                            <p className="mb-0 fs-6">
                              {option.text}
                              {isSelected && (
                                <span className="ms-2 text-muted">
                                  (Your Answer)
                                </span>
                              )}
                              {!isSelected && isCorrect && (
                                <span className="ms-2 text-success fw-semibold">
                                  (Correct Answer)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}  
export default ViewAssessmentResult;
