﻿// <auto-generated />
using System;
using Backendapi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace Backendapi.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20250521154102_UpdateAssessmentCascadeDelete")]
    partial class UpdateAssessmentCascadeDelete
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("Backendapi.Models.Assessment", b =>
                {
                    b.Property<Guid>("AssessmentId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("CourseId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<int?>("MaxScore")
                        .HasColumnType("int");

                    b.Property<string>("Title")
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)");

                    b.HasKey("AssessmentId");

                    b.HasIndex("CourseId");

                    b.ToTable("Assessment", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.Course", b =>
                {
                    b.Property<Guid>("CourseId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("CourseUrl")
                        .IsUnicode(false)
                        .HasColumnType("varchar(max)");

                    b.Property<string>("Description")
                        .HasMaxLength(200)
                        .IsUnicode(false)
                        .HasColumnType("varchar(200)");

                    b.Property<Guid?>("InstructorId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("MediaUrl")
                        .IsUnicode(false)
                        .HasColumnType("varchar(max)");

                    b.Property<string>("Title")
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)");

                    b.HasKey("CourseId");

                    b.HasIndex("InstructorId");

                    b.ToTable("Course", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.Option", b =>
                {
                    b.Property<Guid>("OptionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<bool>("IsCorrect")
                        .HasColumnType("bit");

                    b.Property<Guid>("QuestionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Text")
                        .IsRequired()
                        .HasMaxLength(200)
                        .IsUnicode(false)
                        .HasColumnType("varchar(200)");

                    b.HasKey("OptionId");

                    b.HasIndex("QuestionId");

                    b.ToTable("Option", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.Question", b =>
                {
                    b.Property<Guid>("QuestionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("AssessmentId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("AssessmentId2")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("QuestionText")
                        .IsRequired()
                        .HasMaxLength(500)
                        .IsUnicode(false)
                        .HasColumnType("varchar(500)");

                    b.HasKey("QuestionId");

                    b.HasIndex("AssessmentId");

                    b.ToTable("Question", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.Result", b =>
                {
                    b.Property<Guid>("ResultId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("AssessmentId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<DateTime?>("AttemptDate")
                        .HasColumnType("datetime2");

                    b.Property<int?>("Score")
                        .HasColumnType("int");

                    b.Property<Guid?>("UserId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("ResultId");

                    b.HasIndex("AssessmentId");

                    b.HasIndex("UserId");

                    b.ToTable("Result", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.StudentAnswer", b =>
                {
                    b.Property<Guid>("AnswerId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("QuestionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("ResultId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("SelectedOptionId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("AnswerId");

                    b.HasIndex("QuestionId");

                    b.HasIndex("ResultId");

                    b.HasIndex("SelectedOptionId");

                    b.ToTable("StudentAnswer", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.User", b =>
                {
                    b.Property<Guid>("UserId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Email")
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)");

                    b.Property<string>("Name")
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)");

                    b.Property<string>("PasswordHash")
                        .HasMaxLength(256)
                        .IsUnicode(false)
                        .HasColumnType("varchar(256)");

                    b.Property<string>("PasswordSalt")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("Role")
                        .HasMaxLength(50)
                        .IsUnicode(false)
                        .HasColumnType("varchar(50)");

                    b.HasKey("UserId");

                    b.ToTable("User", (string)null);
                });

            modelBuilder.Entity("CourseUser", b =>
                {
                    b.Property<Guid>("EnrolledCoursesCourseId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("EnrolledStudentsUserId")
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("EnrolledCoursesCourseId", "EnrolledStudentsUserId");

                    b.HasIndex("EnrolledStudentsUserId");

                    b.ToTable("UserEnrollments", (string)null);
                });

            modelBuilder.Entity("Backendapi.Models.Assessment", b =>
                {
                    b.HasOne("Backendapi.Models.Course", "Course")
                        .WithMany("Assessments")
                        .HasForeignKey("CourseId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .HasConstraintName("FK_Assessment_Course");

                    b.Navigation("Course");
                });

            modelBuilder.Entity("Backendapi.Models.Course", b =>
                {
                    b.HasOne("Backendapi.Models.User", "Instructor")
                        .WithMany("Courses")
                        .HasForeignKey("InstructorId")
                        .OnDelete(DeleteBehavior.SetNull)
                        .HasConstraintName("FK_Course_User");

                    b.Navigation("Instructor");
                });

            modelBuilder.Entity("Backendapi.Models.Option", b =>
                {
                    b.HasOne("Backendapi.Models.Question", "Question")
                        .WithMany("Options")
                        .HasForeignKey("QuestionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_Option_Question");

                    b.Navigation("Question");
                });

            modelBuilder.Entity("Backendapi.Models.Question", b =>
                {
                    b.HasOne("Backendapi.Models.Assessment", "Assessment")
                        .WithMany("Questions")
                        .HasForeignKey("AssessmentId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_Question_Assessment");

                    b.Navigation("Assessment");
                });

            modelBuilder.Entity("Backendapi.Models.Result", b =>
                {
                    b.HasOne("Backendapi.Models.Assessment", "Assessment")
                        .WithMany("Results")
                        .HasForeignKey("AssessmentId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .HasConstraintName("FK_Result_Assessment");

                    b.HasOne("Backendapi.Models.User", "User")
                        .WithMany("Results")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .HasConstraintName("FK_Result_User");

                    b.Navigation("Assessment");

                    b.Navigation("User");
                });

            modelBuilder.Entity("Backendapi.Models.StudentAnswer", b =>
                {
                    b.HasOne("Backendapi.Models.Question", "Question")
                        .WithMany()
                        .HasForeignKey("QuestionId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_StudentAnswer_Question");

                    b.HasOne("Backendapi.Models.Result", "Result")
                        .WithMany("StudentAnswers")
                        .HasForeignKey("ResultId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired()
                        .HasConstraintName("FK_StudentAnswer_Result");

                    b.HasOne("Backendapi.Models.Option", "SelectedOption")
                        .WithMany()
                        .HasForeignKey("SelectedOptionId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired()
                        .HasConstraintName("FK_StudentAnswer_Option");

                    b.Navigation("Question");

                    b.Navigation("Result");

                    b.Navigation("SelectedOption");
                });

            modelBuilder.Entity("CourseUser", b =>
                {
                    b.HasOne("Backendapi.Models.Course", null)
                        .WithMany()
                        .HasForeignKey("EnrolledCoursesCourseId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Backendapi.Models.User", null)
                        .WithMany()
                        .HasForeignKey("EnrolledStudentsUserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Backendapi.Models.Assessment", b =>
                {
                    b.Navigation("Questions");

                    b.Navigation("Results");
                });

            modelBuilder.Entity("Backendapi.Models.Course", b =>
                {
                    b.Navigation("Assessments");
                });

            modelBuilder.Entity("Backendapi.Models.Question", b =>
                {
                    b.Navigation("Options");
                });

            modelBuilder.Entity("Backendapi.Models.Result", b =>
                {
                    b.Navigation("StudentAnswers");
                });

            modelBuilder.Entity("Backendapi.Models.User", b =>
                {
                    b.Navigation("Courses");

                    b.Navigation("Results");
                });
#pragma warning restore 612, 618
        }
    }
}
