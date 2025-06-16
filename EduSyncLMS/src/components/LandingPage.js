import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaGraduationCap, FaChartLine, FaBook, FaUsers, FaStar, FaPlayCircle } from "react-icons/fa";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

const courses = [
  { name: "Full Stack Web Development", keyword: "web development" },
  { name: "Data Science & Analytics", keyword: "data science" },
  { name: "Machine Learning with Python", keyword: "machine learning" }
];


export default function LandingPage() {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black text-white min-vh-100 d-flex flex-column position-relative overflow-hidden">
      {/* Header/Navbar */}
      <header className="position-relative z-1">
        <nav className="navbar navbar-expand-lg navbar-dark px-4 py-3">
          <div className="container-fluid">
            <Link className="navbar-brand fw-bold text-primary fs-3" to="/">
              <FaGraduationCap className="me-2" />
              EduSync
            </Link>
            <div className="ms-auto d-flex gap-3">
              <Link to="/login" className="btn btn-outline-dark rounded-pill px-4">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary rounded-pill px-4">
                Register
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Animated background particles */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="position-absolute rounded-circle bg-primary opacity-25"
            style={{
              width: 20,
              height: 20,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main Hero Section */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 z-1 py-5">
        <div className="container">
          <div className="row align-items-center">
        <motion.div
              className="col-lg-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
            >
              <h1 className="display-3 fw-bold text-black mb-4">
                Transform Your Learning Journey with <span className="text-primary">EduSync</span>
              </h1>
              <p className="lead text-secondary mb-4 fs-5">
                Experience personalized learning, interactive assessments, and real-time progress tracking in one powerful platform.
              </p>
              <div className="d-flex gap-3">
                <Link to="/register" className="btn btn-primary btn-lg px-5 rounded-pill">
                  Get Started Free
                </Link>
                <Link to="/courses" className="btn btn-outline-dark btn-lg px-5 rounded-pill">
                  Browse Courses
                </Link>
              </div>
              <div className="mt-4 d-flex align-items-center gap-4">
  <div className="d-flex align-items-center">
    <FaUsers className="text-dark me-2" />
    <span className="text-dark">10K+ Students</span>
  </div>
  <div className="d-flex align-items-center">
    <FaStar className="text-dark me-2" />
    <span className="text-dark">4.8/5 Rating</span>
  </div>
</div>

            </motion.div>
            <motion.div 
              className="col-lg-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="position-relative">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80" 
                  alt="Students learning" 
                  className="img-fluid rounded-4 shadow-lg"
                />
              <a
                href="https://youtu.be/7xsieZFvQxo?si=-6FHgmheZNLtuN8u" 
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary position-absolute bottom-0 start-0 text-white p-3 rounded-3 m-3 d-flex align-items-center"
                >
                <FaPlayCircle className="me-2" />
                Watch Demo
              </a>
           
          </div>
        </motion.div>
          </div>
        </div>
      </main>

      {/* Feature Preview Section */}
      <section className="py-5 z-1">
        <div className="container">
          <motion.h2
            className="text-center text-dark mb-5 fw-bold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Why Choose EduSync?
          </motion.h2>
          <div className="row g-4">
            {[
              {
                icon: <FaBook className="text-primary fs-1 mb-3" />,
                title: "Interactive Courses",
                description: "Engage with high-quality content, video lectures, and real-time feedback from instructors."
              },
              {
                icon: <FaChartLine className="text-primary fs-1 mb-3" />,
                title: "Smart Analytics",
                description: "Track your progress with detailed analytics and personalized performance insights."
              },
              {
                icon: <FaGraduationCap className="text-primary fs-1 mb-3" />,
                title: "Expert Instructors",
                description: "Learn from industry experts and experienced educators in your field."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                className="col-md-4"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="bg-dark rounded-4 p-4 shadow h-100 border border-primary border-opacity-25">
                  {feature.icon}
                  <h4 className="text-white mb-3">{feature.title}</h4>
                  <p className="text-secondary mb-0">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Preview Section */}
      <section className="py-5 z-1 bg-dark">
        <div className="container">
          <motion.h2
            className="text-center text-white mb-5 fw-bold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Popular Courses
          </motion.h2>
          <div className="row g-4">
          {courses.map((course, idx) => (
              <motion.div
                key={idx}
                className="col-md-4"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                
               
  <div key={idx} className="card bg-black border-primary border-opacity-25 h-10">
    <div className="card-body">
      <h5 className="card-title text-white">{course.name}</h5>
      <p className="card-text text-secondary">
        Learn advanced concepts with hands-on projects and expert guidance.
      </p>
      <div className="d-flex justify-content-between align-items-center">
        <Link to="/courses" className="btn btn-primary rounded-pill">
          Learn More
        </Link>
      </div>
    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-5 z-1">
        <div className="container">
          <motion.h2
            className="text-center text-dark mb-5 fw-bold"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
            What Our Students Say
          </motion.h2>
          <div className="row g-4 justify-content-center">
            {[{
              quote: "EduSync transformed my learning experience. The interactive platform and real-time feedback helped me excel in my studies.",
              name: "Aarav Mehta",
              role: "Computer Science Student",
              image: "https://randomuser.me/api/portraits/men/1.jpg"
            }, {
              quote: "The analytics dashboard is a game-changer. I can track my progress and identify areas for improvement instantly.",
              name: "Sneha Kapoor",
              role: "Engineering Student",
              image: "https://randomuser.me/api/portraits/women/1.jpg"
            }, {
              quote: "As an instructor, I love how easy it is to create and manage courses. The student engagement is incredible!",
              name: "Dr. Rahul Sharma",
              role: "Course Instructor",
              image: "https://randomuser.me/api/portraits/men/2.jpg"
            }].map((testimonial, index) => (
              <motion.div
                key={index}
                className="col-md-4"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-dark rounded-4 p-4 shadow h-100 border border-primary border-opacity-25">
                  <div className="d-flex align-items-center mb-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="rounded-circle me-3"
                      width="50"
                      height="50"
                    />
                    <div>
                      <h5 className="text-white mb-0">{testimonial.name}</h5>
                      <small className="text-secondary">{testimonial.role}</small>
                    </div>
                  </div>
                  <p className="text-secondary mb-0">"{testimonial.quote}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 z-1 bg-primary bg-opacity-10">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-white mb-4">Ready to Start Your Learning Journey?</h2>
            <p className="lead text-secondary mb-4">
              Join thousands of students who are already learning with EduSync
            </p>
            <Link to="/register" className="btn btn-primary btn-lg px-5 rounded-pill">
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="bg-black text-secondary text-center py-4 z-1">
        <div className="container">
          <div className="row">
            <div className="col-md-4 mb-3">
              <h5 className="text-white">EduSync</h5>
              <p className="small">Empowering education through technology</p>
            </div>
            <div className="col-md-4 mb-3">
              <h5 className="text-white">Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/courses" className="text-secondary text-decoration-none">Courses</Link></li>
                <li><Link to="/about" className="text-secondary text-decoration-none">About Us</Link></li>
                <li><Link to="/contact" className="text-secondary text-decoration-none">Contact</Link></li>
              </ul>
            </div>
            <div className="col-md-4 mb-3">
              <h5 className="text-white">Connect With Us</h5>
              <div className="d-flex gap-3 justify-content-center text-secondary">
  <a href="https://www.facebook.com/capgemini/" aria-label="Facebook"><FaFacebook size={24} /></a>
  <a href="https://x.com/capgemini?lang=en" aria-label="Twitter"><FaTwitter size={24} /></a>
  <a href="https://in.linkedin.com/in/aryan-raj-singh-rathore-565b7a232" aria-label="LinkedIn"><FaLinkedin size={24} /></a>
  <a href="https://www.instagram.com/capgemini/" aria-label="Instagram"><FaInstagram size={24} /></a>
</div>
            </div>
          </div>
          <hr className="my-4" />
          <small>&copy; 2024 EduSync. All rights reserved.</small>
        </div>
      </footer>
    </div>
  );
}
