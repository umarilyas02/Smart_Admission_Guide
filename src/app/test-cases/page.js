"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Search, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TEST_CASES = [
  {
    id: "UC-1-TC-01", tableNum: 25, num: 1,
    module: "User Registration", title: "Successful User Registration", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the student can register by providing valid email, password, and contact details, and that the system creates an account successfully.",
    preCondition: "The student has internet access and is on the sign-up page.",
    postCondition: "A new student profile is created, and the student's details are stored securely in the system.",
    steps: [
      { step: 1, testStep: "Access the sign-up page", testData: "", expectedResult: "The sign-up page should load successfully" },
      { step: 2, testStep: "Enter valid email, password, and contact info", testData: "Enter Name, Phone, Email.", expectedResult: "The system should accept the data and move to next validation step" },
      { step: 3, testStep: 'Click "Submit"', testData: "", expectedResult: "The system should validate the data" },
      { step: 4, testStep: "System sends a confirmation email", testData: "", expectedResult: "The system should send a confirmation email to the provided email address" },
      { step: 5, testStep: "Check database", testData: "", expectedResult: "The student's profile should be stored securely in the system" },
    ],
  },
  {
    id: "UC-1-TC-02", tableNum: 26, num: 2,
    module: "User Registration", title: "Invalid Email Format", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system prompts the student to enter a valid email when an invalid email format is provided.",
    preCondition: "The student is on the sign-up page.",
    postCondition: "User successfully registered.",
    steps: [
      { step: 1, testStep: "Access the sign-up page", testData: "", expectedResult: "The sign-up page should load successfully" },
      { step: 2, testStep: "Enter invalid email format", testData: "Enter Name, Phone, Email.", expectedResult: "The system should prompt the student to enter a valid email" },
      { step: 3, testStep: 'Click "Submit"', testData: "", expectedResult: 'Error message: "Please enter a valid email" should appear' },
    ],
  },
  {
    id: "UC-1-TC-03", tableNum: 27, num: 3,
    module: "User Registration", title: "Weak Password", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system prompts the student to create a stronger password when the entered password does not meet security requirements.",
    preCondition: "The student is on the sign-up page.",
    postCondition: "User successfully registered.",
    steps: [
      { step: 1, testStep: "Access the sign-up page", testData: "", expectedResult: "The sign-up page should load successfully" },
      { step: 2, testStep: "Enter weak password", testData: "Enter Name, Phone, Email.", expectedResult: "The system should prompt the student to create a stronger password" },
      { step: 3, testStep: 'Click "Submit"', testData: "", expectedResult: 'Error message: "Password is too weak. Please choose a stronger password" should appear' },
    ],
  },
  {
    id: "UC-1-TC-04", tableNum: 28, num: 4,
    module: "User Registration", title: "Duplicate Account", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system prevents registration if the email is already registered.",
    preCondition: "The student is on the sign-up page, and the email is already registered.",
    postCondition: "User successfully registered.",
    steps: [
      { step: 1, testStep: "Access the sign-up page", testData: "", expectedResult: "The sign-up page should load successfully" },
      { step: 2, testStep: "Enter an already registered email", testData: "Enter Name, Phone, Email.", expectedResult: "The system should alert the user that the email is already in use." },
      { step: 3, testStep: 'Click "Submit"', testData: "", expectedResult: 'Error message: "This email is already registered" should appear' },
    ],
  },
  {
    id: "UC-1-TC-05", tableNum: 29, num: 5,
    module: "User Registration", title: "Missing Required Field", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system prompts the student to fill in all required fields if any field is left empty.",
    preCondition: "The student is on the sign-up page.",
    postCondition: "User successfully registered.",
    steps: [
      { step: 1, testStep: "Access the sign-up page", testData: "", expectedResult: "The sign-up page should load successfully" },
      { step: 2, testStep: "Leave a required field empty", testData: "Enter name and email only.", expectedResult: "The system should alert the user to fill in all required fields" },
      { step: 3, testStep: 'Click "Submit"', testData: "", expectedResult: 'Error message: "Please fill in all required fields" should appear' },
    ],
  },
  {
    id: "UC-2-TC-01", tableNum: 30, num: 6,
    module: "User Login", title: "Successful User Login", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the student can successfully log in using valid credentials.",
    preCondition: "Students have a registered account and knows their login credentials.",
    postCondition: "The student successfully logs in and gains access to their account.",
    steps: [
      { step: 1, testStep: "Access the login page", testData: "", expectedResult: "The login page should load successfully" },
      { step: 2, testStep: "Enter valid email and password", testData: "Enter email and password.", expectedResult: "The system should validate the credentials and grant access to the student's profile" },
      { step: 3, testStep: 'Click "Login"', testData: "", expectedResult: "The student should be directed to their profile page" },
    ],
  },
  {
    id: "UC-2-TC-02", tableNum: 31, num: 7,
    module: "User Login", title: "Invalid Credentials", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the system prompts the student to re-enter their credentials when the password is incorrect.",
    preCondition: "Test if the system prompts the student to re-enter their credentials when the password is incorrect.",
    postCondition: "User successfully login.",
    steps: [
      { step: 1, testStep: "Access the login page", testData: "", expectedResult: "The login page should load successfully" },
      { step: 2, testStep: "Enter valid email and incorrect password", testData: "Enter email and password.", expectedResult: "The system should prompt the student to re-enter their credentials" },
      { step: 3, testStep: 'Click "Login"', testData: "", expectedResult: 'Error message: "Invalid password, please try again" should appear' },
    ],
  },
  {
    id: "UC-2-TC-03", tableNum: 32, num: 8,
    module: "User Login", title: "Password Recovery", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the system allows the student to reset their password after multiple failed login attempts.",
    preCondition: "The student has an account and has been locked out due to failed login attempts.",
    postCondition: "The student successfully resets their password and logs into their account.",
    steps: [
      { step: 1, testStep: "Access the login page", testData: "", expectedResult: "The login page should be loaded successfully." },
      { step: 2, testStep: 'Click "Forget Password"', testData: "", expectedResult: "The system should prompt the student to enter their registered email." },
      { step: 3, testStep: "Enter registered email", testData: "Enter Email.", expectedResult: "The system should send a password recovery link to the email." },
      { step: 4, testStep: "Click the recovery link and reset password", testData: "Enter your password and email.", expectedResult: "The system should allow the student to set a new password and login successfully." },
    ],
  },
  {
    id: "UC-3-TC-01", tableNum: 33, num: 9,
    module: "Edit Profile", title: "Successful Profile Update", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the student can successfully update their profile with valid personal and academic information.",
    preCondition: "The student is logged in and is on the profile edit page.",
    postCondition: "The student's profile is successfully updated with new information.",
    steps: [
      { step: 1, testStep: "Access the edit page", testData: "", expectedResult: "The profile edit page should load successfully" },
      { step: 2, testStep: "Enter valid personal and academic details", testData: "Enter the information.", expectedResult: "The system should accept the updated details and validate them" },
      { step: 3, testStep: 'Click "Save"', testData: "", expectedResult: "The system should save the updated profile information and confirm the changes" },
    ],
  },
  {
    id: "UC-3-TC-02", tableNum: 34, num: 10,
    module: "Edit Profile", title: "Invalid Data Format", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system prompts the student to enter valid data when the data format is incorrect.",
    preCondition: "The student is logged in and is on the profile edit page.",
    postCondition: "The student's profile is successfully updated with new information.",
    steps: [
      { step: 1, testStep: "Access the edit page", testData: "", expectedResult: "The profile edit page should be loaded successfully." },
      { step: 2, testStep: "Enter invalid data format.", testData: "Enter data.", expectedResult: "The system should prompt the student to enter valid data." },
      { step: 3, testStep: 'Click "Save"', testData: "", expectedResult: 'Error message: "Please enter valid details" should appear.' },
    ],
  },
  {
    id: "UC-3-TC-03", tableNum: 35, num: 11,
    module: "Edit Profile", title: "Failed Profile Update", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system notifies the student if the profile update fails due to a system error.",
    preCondition: "The student is logged in and is on the profile edit page.",
    postCondition: "The student's profile is successfully updated with new information.",
    steps: [
      { step: 1, testStep: "Access the edit page.", testData: "", expectedResult: "The profile edit page should load successfully" },
      { step: 2, testStep: "Enter valid data.", testData: "Enter the information.", expectedResult: "The system should accept the updated details" },
      { step: 3, testStep: "Simulate system failure during save.", testData: "", expectedResult: "The system should notify the student of the failure and prompt them to try again" },
      { step: 4, testStep: 'Click "Save"', testData: "", expectedResult: 'Error message: "Profile update failed. Please try again" should appear' },
    ],
  },
  {
    id: "UC-4-TC-01", tableNum: 36, num: 12,
    module: "Adaptive Quiz", title: "Successful Quiz Completion", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the student can successfully complete the adaptive quiz and receive personalized recommendations based on their responses.",
    preCondition: "The student is logged in and is ready to take the quiz.",
    postCondition: "The student receives personalized career and university suggestions based on their quiz responses.",
    steps: [
      { step: 1, testStep: "Access the quiz page", testData: "", expectedResult: "The quiz page should load successfully" },
      { step: 2, testStep: "Start answering quiz questions", testData: "", expectedResult: "The system should adjust the following questions based on the answers given" },
      { step: 3, testStep: "Complete the quiz", testData: "Random answers based on personal choice", expectedResult: "After completing, the system should show career and university suggestions" },
      { step: 4, testStep: "View recommendations", testData: "", expectedResult: "Personalized recommendations should be displayed" },
    ],
  },
  {
    id: "UC-4-TC-02", tableNum: 37, num: 13,
    module: "Adaptive Quiz", title: "Incorrect Answers Handling", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure that the system can handle incorrect answers and still provide appropriate suggestions.",
    preCondition: "The student is logged in and is ready to take the quiz.",
    postCondition: "The student receives personalized career and university suggestions based on their quiz responses.",
    steps: [
      { step: 1, testStep: "Access the quiz page", testData: "", expectedResult: "The quiz page should load successfully" },
      { step: 2, testStep: "Answer some questions incorrectly", testData: "Incorrect answers", expectedResult: "The system should give recommendations based on these wrong answers" },
      { step: 3, testStep: "Finish the quiz", testData: "", expectedResult: "The system should generate suggestions even if some answers were wrong" },
    ],
  },
  {
    id: "UC-4-TC-03a", tableNum: 38, num: 14,
    module: "Adaptive Quiz", title: "Incomplete Quiz Submission", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Check if the system alerts the student when they try to submit the quiz without completing it.",
    preCondition: "The student is logged in and is ready to take the quiz.",
    postCondition: "The student receives personalized career and university suggestions based on their quiz responses.",
    steps: [
      { step: 1, testStep: "Access the quiz page", testData: "", expectedResult: "The quiz page should load successfully" },
      { step: 2, testStep: "Start the quiz but leave some questions unanswered", testData: "", expectedResult: "The system should alert the student to complete the quiz before submitting" },
      { step: 3, testStep: "Try to submit without completing the quiz", testData: "", expectedResult: 'Error message: "Please complete the quiz before submitting" should appear' },
    ],
  },
  {
    id: "UC-4-TC-03b", tableNum: 39, num: 15,
    module: "Adaptive Quiz", title: "Dynamic Question Changes Based on Answers", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure the system adjusts the questions during the quiz based on the students' answers.",
    preCondition: "The student is logged in and is ready to take the quiz.",
    postCondition: "The student receives personalized career and university suggestions based on their quiz responses.",
    steps: [
      { step: 1, testStep: "Access the quiz page", testData: "", expectedResult: "The quiz page should load successfully" },
      { step: 2, testStep: "Start answering the questions", testData: "", expectedResult: "The system should adjust the next questions based on the student's responses" },
      { step: 3, testStep: "Complete the quiz", testData: "", expectedResult: "The system should show personalized suggestions after completing the quiz" },
    ],
  },
  {
    id: "UC-5-TC-01", tableNum: 40, num: 16,
    module: "View Career Recommendations", title: "Displaying Career Suggestions", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system shows personalized career recommendations based on the student's quiz responses and profile information.",
    preCondition: "The student is logged in and is ready to take the quiz.",
    postCondition: "The student will see 3–8 personalized career suggestions based on their answers.",
    steps: [
      { step: 1, testStep: "Complete the quiz", testData: "Responses based on student preferences", expectedResult: "The student finishes the quiz" },
      { step: 2, testStep: "View career recommendations", testData: "", expectedResult: "The system displays relevant career recommendations based on the student's answers" },
    ],
  },
  {
    id: "UC-5-TC-02", tableNum: 41, num: 17,
    module: "View Career Recommendations", title: "Display Alternative Career Options", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system can suggest alternative careers if no exact match is found based on the student's quiz responses.",
    preCondition: "The student is logged in and is ready to take the quiz.",
    postCondition: "The student is presented with alternative career options if no perfect matches are found.",
    steps: [
      { step: 1, testStep: "Complete the quiz", testData: "", expectedResult: "The student finishes the quiz" },
      { step: 2, testStep: "Process the student data", testData: "", expectedResult: "The system analyzes the answers and profile" },
      { step: 3, testStep: "Display alternative career suggestions", testData: "", expectedResult: "If no direct match is found, the system suggests alternative career options" },
    ],
  },
  {
    id: "UC-5-TC-03", tableNum: 42, num: 18,
    module: "View Career Recommendations", title: "Handle Data Processing Error", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Check if the system notifies the student when there is an error processing their data for career recommendations.",
    preCondition: "The student has completed the quiz, but there is an issue with data processing.",
    postCondition: "The system informs the student of a processing error and requests them to retry.",
    steps: [
      { step: 1, testStep: "Complete the quiz", testData: "", expectedResult: "The student finishes the quiz" },
      { step: 2, testStep: "Process the student data", testData: "", expectedResult: "The system processes the data" },
      { step: 3, testStep: "Handle error", testData: "", expectedResult: 'If there is an error, the system displays a message: "Data processing error. Please try again."' },
    ],
  },
  {
    id: "UC-6-TC-01", tableNum: 43, num: 19,
    module: "Upload Academic Documents", title: "Successful Document Upload", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the student can upload a document successfully.",
    preCondition: "The student is logged in and has a document ready to upload.",
    postCondition: "The document is successfully uploaded and linked to the student's profile.",
    steps: [
      { step: 1, testStep: 'Go to the "Upload Documents" section', testData: "", expectedResult: "The document upload page should open correctly" },
      { step: 2, testStep: "Select a document to upload", testData: "Upload documents", expectedResult: "The document should be ready for uploading" },
      { step: 3, testStep: "Upload the document", testData: "", expectedResult: "The document should be uploaded and attached to the profile" },
    ],
  },
  {
    id: "UC-6-TC-02", tableNum: 44, num: 20,
    module: "Upload Academic Documents", title: "Unsupported File Type", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the system alerts the student when they try to upload an unsupported file.",
    preCondition: "The student is logged in and has a document ready to upload.",
    postCondition: "The document is successfully uploaded and linked to the student's profile.",
    steps: [
      { step: 1, testStep: 'Go to the "Upload Documents" section', testData: "", expectedResult: "The document upload page should open correctly" },
      { step: 2, testStep: "Try to upload an unsupported file", testData: "Upload documents", expectedResult: "The system should show an error message that the file type is not supported" },
      { step: 3, testStep: 'Click "Upload"', testData: "", expectedResult: 'Error message: "Unsupported file type. Please upload a valid file."' },
    ],
  },
  {
    id: "UC-6-TC-03", tableNum: 45, num: 21,
    module: "Upload Academic Documents", title: "File Size Too Large", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the system alerts the student when the file size is too large to upload.",
    preCondition: "The student is logged in and has a document ready to upload.",
    postCondition: "The document is successfully uploaded and linked to the student's profile.",
    steps: [
      { step: 1, testStep: 'Go to the "Upload Documents" section', testData: "", expectedResult: "The document upload page should open correctly" },
      { step: 2, testStep: "Select a large file to upload", testData: "Upload documents", expectedResult: "The system should alert the student that the file is too large" },
      { step: 3, testStep: 'Click "Upload"', testData: "", expectedResult: 'Error message: "File size is too large. Please upload a smaller file."' },
    ],
  },
  {
    id: "UC-6-TC-04", tableNum: 46, num: 22,
    module: "Upload Academic Documents", title: "Upload Failure Due to Error", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the system displays an error message when the upload fails due to a technical issue.",
    preCondition: "The student is logged in and has a document ready to upload.",
    postCondition: "The document is successfully uploaded and linked to the student's profile.",
    steps: [
      { step: 1, testStep: 'Go to the "Upload Documents" section', testData: "", expectedResult: "The document upload page should open correctly" },
      { step: 2, testStep: "Select a document to upload", testData: "Upload documents", expectedResult: "The system attempts to upload the file" },
      { step: 3, testStep: "Simulate a technical issue.", testData: "", expectedResult: 'The system should display an error message: "Upload failed. Please try again."' },
    ],
  },
  {
    id: "UC-6-TC-05", tableNum: 47, num: 23,
    module: "Upload Academic Documents", title: "Upload Multiple Documents", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the student can upload multiple documents at a time.",
    preCondition: "The student is logged in and has multiple documents ready to upload.",
    postCondition: "Multiple documents are uploaded and linked to the student's profile.",
    steps: [
      { step: 1, testStep: 'Go to the "Upload Documents" section', testData: "", expectedResult: "The upload page should open correctly." },
      { step: 2, testStep: "Select multiple documents for upload", testData: "Upload documents", expectedResult: "The system should allow uploading multiple documents at once." },
      { step: 3, testStep: 'Click "Upload"', testData: "", expectedResult: "All selected documents should be uploaded and linked to the profile." },
    ],
  },
  {
    id: "UC-7-TC-01", tableNum: 48, num: 24,
    module: "Generate Application Documents", title: "Generate Document Successfully", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the student can generate the application document based on their profile details.",
    preCondition: "The student is logged in and has a complete profile.",
    postCondition: "The document is generated and either saved or downloaded successfully.",
    steps: [
      { step: 1, testStep: 'Open the "Generate Documents" section', testData: "", expectedResult: "The document generation page should be loaded properly." },
      { step: 2, testStep: "Choose the document type.", testData: "", expectedResult: "The student should be able to select a document type." },
      { step: 3, testStep: 'Click on "Generate"', testData: "Select the option.", expectedResult: "The system should generate the document using the profile data." },
      { step: 4, testStep: "Review the generated document", testData: "", expectedResult: "The student should be able to review the document." },
      { step: 5, testStep: "Save or download the document", testData: "", expectedResult: "The student should be able to save or download the document." },
    ],
  },
  {
    id: "UC-7-TC-02", tableNum: 49, num: 25,
    module: "Generate Application Documents", title: "Profile Information Missing", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure the system prompts the student to complete their profile if any required information is missing before generating the document.",
    preCondition: "The student is logged in and has a complete profile.",
    postCondition: "The document is generated and either saved or downloaded successfully.",
    steps: [
      { step: 1, testStep: 'Open the "Generate Documents" section', testData: "", expectedResult: "The document generation page should be loaded properly." },
      { step: 2, testStep: "Try to generate the document", testData: "Select the option.", expectedResult: "The system should ask the student to complete their profile before proceeding." },
      { step: 3, testStep: "Try to generate the document", testData: "", expectedResult: "The system should display a message indicating missing profile information." },
    ],
  },
  {
    id: "UC-7-TC-03", tableNum: 50, num: 26,
    module: "Generate Application Documents", title: "Document Generation Error", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test the system's response if there's an error during document generation.",
    preCondition: "The student is logged in and has a complete profile.",
    postCondition: "The document is generated and either saved or downloaded successfully.",
    steps: [
      { step: 1, testStep: 'Open the "Generate Documents" section', testData: "", expectedResult: "The document generation page should be loaded properly." },
      { step: 2, testStep: "Select a document to generate", testData: "Select the option.", expectedResult: "The system should attempt to generate the document." },
      { step: 3, testStep: "Encounter a failure during document creation", testData: "", expectedResult: 'The system should show an error: "Error generating document. Please try again."' },
    ],
  },
  {
    id: "UC-7-TC-04", tableNum: 51, num: 27,
    module: "Generate Application Documents", title: "Editing Generated Document", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the student can edit the generated document before finalizing it.",
    preCondition: "The student is logged in and has a complete profile.",
    postCondition: "The document is generated and either saved or downloaded successfully.",
    steps: [
      { step: 1, testStep: 'Open the "Generate Documents" section', testData: "", expectedResult: "The document generation page should be loaded properly." },
      { step: 2, testStep: "Edit the content of the document.", testData: "", expectedResult: "The student should be able to modify the document content." },
      { step: 3, testStep: "Save or download the edited document.", testData: "", expectedResult: "The student should be able to save or download the updated document." },
    ],
  },
  {
    id: "UC-8-TC-01", tableNum: 52, num: 28,
    module: "Check Admission Probability", title: "Successful Calculation of Admission Probability", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system correctly calculates and displays the admission probability based on the student's data.",
    preCondition: "The student is logged in, and their profile is complete.",
    postCondition: "The student sees the admission probability for each selected university.",
    steps: [
      { step: 1, testStep: 'Access the "Admission Probability" section', testData: "", expectedResult: 'Access the "Admission Probability" section' },
      { step: 2, testStep: "Select universities to apply to", testData: "Enter the universities name.", expectedResult: "The student should be able to select one or more universities." },
      { step: 3, testStep: 'Click "Calculate"', testData: "", expectedResult: "The system should calculate and display the admission probability for each selected university." },
    ],
  },
  {
    id: "UC-8-TC-02", tableNum: 53, num: 29,
    module: "Check Admission Probability", title: "Profile Information Missing", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure the system prompts the student to complete their profile if any required information is missing before calculating admission probability.",
    preCondition: "The student is logged in, and their profile is complete.",
    postCondition: "The student sees the admission probability for each selected university.",
    steps: [
      { step: 1, testStep: 'Access the "Admission Probability" section', testData: "", expectedResult: 'Access the "Admission Probability" section' },
      { step: 2, testStep: "Try to calculate the admission probability", testData: "", expectedResult: "The system should detect missing profile information and prompt the student to complete their profile." },
      { step: 3, testStep: 'Click "Calculate"', testData: "", expectedResult: "The system should prevent the calculation and alert the student to complete the missing fields." },
    ],
  },
  {
    id: "UC-8-TC-03", tableNum: 54, num: 30,
    module: "Check Admission Probability", title: "Error During Data Processing", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the system handles errors during the data processing of the admission probability and notifies the student.",
    preCondition: "The student is logged in, and their profile is complete.",
    postCondition: "The student sees the admission probability for each selected university.",
    steps: [
      { step: 1, testStep: 'Access the "Admission Probability" section', testData: "", expectedResult: 'Access the "Admission Probability" section' },
      { step: 2, testStep: "Select universities to apply to", testData: "Enter the university name.", expectedResult: "The student selects one or more universities." },
      { step: 3, testStep: 'Click "Calculate"', testData: "", expectedResult: "The system should attempt to process the data but encounter an error." },
      { step: 4, testStep: "Receive an error message", testData: "", expectedResult: 'The system should display an error message: "There was an issue processing your data. Please try again later."' },
    ],
  },
  {
    id: "UC-9-TC-01", tableNum: 55, num: 31,
    module: "Receive Dashboard Alerts", title: "Alert for Upcoming Deadlines", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the system generates an alert when important deadlines are approaching.",
    preCondition: "The student is logged in, and a critical deadline is approaching.",
    postCondition: "The student is notified about an upcoming deadline via the dashboard alert.",
    steps: [
      { step: 1, testStep: 'Access the "Dashboard" section', testData: "", expectedResult: "The dashboard should be loaded properly." },
      { step: 2, testStep: "Wait for the system to trigger a deadline alert", testData: "", expectedResult: "The system should generate an alert when a deadline is near." },
      { step: 3, testStep: "View the alert", testData: "", expectedResult: "The student should see the alert about the upcoming deadline." },
    ],
  },
  {
    id: "UC-9-TC-02", tableNum: 56, num: 32,
    module: "Receive Dashboard Alerts", title: "Reminder Alert for Missed Notifications", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Check if the system sends a reminder if the student misses an initial alert.",
    preCondition: "The student is logged in, and a critical deadline is approaching.",
    postCondition: "The student is notified about an upcoming deadline via the dashboard alert.",
    steps: [
      { step: 1, testStep: 'Access the "Dashboard" section', testData: "", expectedResult: "The dashboard should be loaded properly." },
      { step: 2, testStep: "Miss the initial alert", testData: "", expectedResult: "The system should send a reminder alert to the student." },
      { step: 3, testStep: "View the reminder alert", testData: "", expectedResult: "The student should see the reminder alert for the missed notification." },
    ],
  },
  {
    id: "UC-10-TC-01", tableNum: 57, num: 33,
    module: "Use AI-Powered Chatbot", title: "Successful Response from Chatbot", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the chatbot responds correctly to student inquiries.",
    preCondition: "The student is logged into the system, and the chatbot is functioning.",
    postCondition: "The chatbot provides the correct answer to the student's query.",
    steps: [
      { step: 1, testStep: "Access the chatbot interface", testData: "", expectedResult: "The chatbot interface should open properly without issues." },
      { step: 2, testStep: "Ask a relevant question", testData: '"What are the best universities for Computer Science?"', expectedResult: "The chatbot should provide a clear, relevant, and accurate response." },
      { step: 3, testStep: "Ask a relevant question", testData: "", expectedResult: "The response should directly address the question asked." },
    ],
  },
  {
    id: "UC-10-TC-02", tableNum: 58, num: 34,
    module: "Use AI-Powered Chatbot", title: "Handling Follow-Up Queries", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure that the chatbot can handle follow-up questions.",
    preCondition: "The student is logged into the system, and the chatbot is functioning.",
    postCondition: "The chatbot provides the correct answer to the student's query.",
    steps: [
      { step: 1, testStep: "Access the chatbot interface", testData: "", expectedResult: "The chatbot interface should open properly without issues." },
      { step: 2, testStep: "Ask an initial question", testData: '"What are the best career paths in AI?"', expectedResult: "The chatbot should provide a list of relevant career options." },
      { step: 3, testStep: "Ask a follow-up question", testData: '"What qualifications are needed for AI?"', expectedResult: "The chatbot should provide specific qualifications and skills needed for the career." },
    ],
  },
  {
    id: "UC-10-TC-03", tableNum: 59, num: 35,
    module: "Use AI-Powered Chatbot", title: "Handling Unsupported Questions", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test if the chatbot can handle unsupported or out-of-context questions.",
    preCondition: "The student is logged into the system, and the chatbot is functioning.",
    postCondition: "The chatbot provides the correct answer to the student's query.",
    steps: [
      { step: 1, testStep: "Access the chatbot interface", testData: "", expectedResult: "The chatbot interface should open properly without issues." },
      { step: 2, testStep: "Ask an unsupported question", testData: '"What is the capital of the Moon?"', expectedResult: "The chatbot should inform the student that it cannot answer the question and provide alternative resources." },
    ],
  },
  {
    id: "UC-10-TC-04", tableNum: 60, num: 36,
    module: "Use AI-Powered Chatbot", title: "Error Handling in Chatbot", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Test the Chatbot's ability to handle errors in processing queries and notify the student of the issue.",
    preCondition: "The student is logged into the system, and the chatbot is functioning.",
    postCondition: "The chatbot provides the correct answer to the student's query.",
    steps: [
      { step: 1, testStep: "Access the chatbot interface", testData: "", expectedResult: "The chatbot interface should open properly without issues." },
      { step: 2, testStep: "Ask a question.", testData: '"What are the admission requirements for Computer Science?"', expectedResult: "The chatbot attempts to process the question but encounters an error." },
      { step: 3, testStep: "Receive error messages.", testData: "", expectedResult: 'The chatbot should display an error message, such as: "Sorry, there is an issue processing your request. Please try again later."' },
    ],
  },
  {
    id: "UC-11-TC-01", tableNum: 61, num: 37,
    module: "Admin - Manage Users", title: "Add New Content to the Website", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the admin can successfully add new content to the website.",
    preCondition: "Admin open dashboard.",
    postCondition: "The new content has been successfully added to the website.",
    steps: [
      { step: 1, testStep: 'Navigate to the "Manage Content" section', testData: "", expectedResult: "Admin should access the content management page." },
      { step: 2, testStep: 'Click on "Add New Content"', testData: "", expectedResult: "The system should open a form to add new content." },
      { step: 3, testStep: "Fill in content details", testData: "Content.", expectedResult: "The system should allow the admin to input content." },
      { step: 4, testStep: "Submit the content", testData: "", expectedResult: "The system should save the content and display a success message." },
    ],
  },
  {
    id: "UC-11-TC-02", tableNum: 62, num: 38,
    module: "Admin - Manage Users", title: "Update System Settings", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the admin can modify the system settings, such as platform theme or security settings.",
    preCondition: "Admin open dashboard.",
    postCondition: "The system setting is updated successfully.",
    steps: [
      { step: 1, testStep: 'Navigate to the "System Settings" section', testData: "", expectedResult: "Admin should access the system settings page." },
      { step: 2, testStep: "Select a setting to update", testData: "Change data", expectedResult: "The system should allow the admin to update the setting." },
      { step: 3, testStep: "Save the changes", testData: "", expectedResult: "The system should apply the new setting and display a confirmation message." },
    ],
  },
  {
    id: "UC-11-TC-03", tableNum: 63, num: 39,
    module: "Admin - Manage Users", title: "View Website Analytics", priority: "Medium",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Verify that the admin can access and view website analytics.",
    preCondition: "Admin opens the dashboard.",
    postCondition: "The admin can view and export analytics data.",
    steps: [
      { step: 1, testStep: 'Access the "Analytics" section', testData: "", expectedResult: "Admin should be able to access the analytics page." },
      { step: 2, testStep: "View the website analytics", testData: "", expectedResult: "The system should display data analytics." },
    ],
  },
  {
    id: "WC-TC-001", tableNum: 64, num: 40,
    module: "Website Functionality", title: "Verify Homepage Loads Correctly", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure the homepage loads properly with all its content, including images, text, and links.",
    preCondition: "The website URL is functional and accessible.",
    postCondition: "The homepage is loaded successfully with proper content and functional links.",
    steps: [
      { step: 1, testStep: "Open the homepage", testData: "", expectedResult: "The homepage should load without errors and display all content." },
      { step: 2, testStep: "Open the homepage", testData: "", expectedResult: "All text, images, and media should be displayed correctly and aligned properly." },
      { step: 3, testStep: "Test all links on the homepage", testData: "", expectedResult: "All links should be redirected to the correct pages." },
    ],
  },
  {
    id: "WC-TC-002", tableNum: 65, num: 41,
    module: "Website Navigation", title: "Verify Navigation Links Functionality", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure that the website's navigation links are working correctly.",
    preCondition: "The website is live, and the navigation menu is visible.",
    postCondition: "All navigation links should be redirected to the correct pages and function properly.",
    steps: [
      { step: 1, testStep: "Click on each link in the navigation menu", testData: "", expectedResult: "The system should correctly redirect to the corresponding page for each link." },
      { step: 2, testStep: "Verify content loads", testData: "", expectedResult: "Each page should load fully and display the correct content." },
    ],
  },
  {
    id: "WC-TC-003", tableNum: 66, num: 42,
    module: "Website Performance", title: "Verify Website Load Speed", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure the website loads within an acceptable time frame.",
    preCondition: "The website is accessible and functional.",
    postCondition: "The website should load in an acceptable amount of time, providing a smooth user experience.",
    steps: [
      { step: 1, testStep: "Load the homepage", testData: "", expectedResult: "The website should load fully in 3-5 seconds." },
      { step: 2, testStep: "Test website pages", testData: "", expectedResult: "All pages should be loaded quickly without noticeable delays." },
    ],
  },
  {
    id: "WC-TC-004", tableNum: 67, num: 43,
    module: "Website Backup & Recovery", title: "Verify Website Data Backup and Recovery", priority: "High",
    designer: "Neelam Shehzadi", designDate: "05/01/2026",
    description: "Ensure that the website's data can be backed up and recovered successfully.",
    preCondition: "The website is live and contains data.",
    postCondition: "Website data is successfully restored from backups.",
    steps: [
      { step: 1, testStep: "The website is live and contains data.", testData: "", expectedResult: "The system should simulate data loss." },
      { step: 2, testStep: "Restore data from backup.", testData: "", expectedResult: "The system should restore data from backup successfully." },
    ],
  },
];

const MODULES = ["All", ...Array.from(new Set(TEST_CASES.map(tc => tc.module)))];
const STATUS_VALUES = ["pending", "pass", "fail"];

function initStepStatuses() {
  const map = {};
  for (const tc of TEST_CASES) {
    map[tc.id] = {};
    for (const s of tc.steps) {
      map[tc.id][s.step] = "pending";
    }
  }
  return map;
}

function getOverallStatus(tcId, stepStatuses) {
  const steps = Object.values(stepStatuses[tcId] || {});
  if (steps.length === 0) return "pending";
  if (steps.every(s => s === "pass")) return "pass";
  if (steps.some(s => s === "fail")) return "fail";
  return "pending";
}

const STATUS_CONFIG = {
  pass:    { label: "Pass",    bg: "bg-green-100",  text: "text-green-700",  border: "border-green-300",  icon: CheckCircle2, dot: "bg-green-500"  },
  fail:    { label: "Fail",    bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300",    icon: XCircle,      dot: "bg-red-500"    },
  pending: { label: "Pending", bg: "bg-gray-100",   text: "text-gray-500",  border: "border-gray-200",   icon: Clock,        dot: "bg-gray-400"   },
};

const PRIORITY_CONFIG = {
  High:   "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low:    "bg-blue-100 text-blue-700 border border-blue-200",
};

export default function TestCasesPage() {
  const [stepStatuses, setStepStatuses] = useState(initStepStatuses);
  const [expanded, setExpanded]         = useState({});
  const [search, setSearch]             = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");

  function cycleStepStatus(tcId, stepNum) {
    setStepStatuses(prev => {
      const cur = prev[tcId][stepNum];
      const next = STATUS_VALUES[(STATUS_VALUES.indexOf(cur) + 1) % STATUS_VALUES.length];
      return { ...prev, [tcId]: { ...prev[tcId], [stepNum]: next } };
    });
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const filtered = useMemo(() => {
    return TEST_CASES.filter(tc => {
      const matchMod = moduleFilter === "All" || tc.module === moduleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || tc.title.toLowerCase().includes(q) || tc.id.toLowerCase().includes(q) || tc.module.toLowerCase().includes(q);
      return matchMod && matchSearch;
    });
  }, [search, moduleFilter]);

  const stats = useMemo(() => {
    let pass = 0, fail = 0, pending = 0;
    for (const tc of TEST_CASES) {
      const s = getOverallStatus(tc.id, stepStatuses);
      if (s === "pass") pass++;
      else if (s === "fail") fail++;
      else pending++;
    }
    return { total: TEST_CASES.length, pass, fail, pending };
  }, [stepStatuses]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Test Cases</h1>
          <p className="text-gray-500 text-sm">Smart Admission Guide — Extended Test Cases (Section 7.1)</p>
          <p className="text-gray-400 text-xs mt-1">Designed by Neelam Shehzadi &nbsp;·&nbsp; Design Date: 05/01/2026 &nbsp;·&nbsp; 43 test cases across 13 modules</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total",   value: stats.total,   color: "text-blue-600",  bg: "bg-blue-50 border-blue-200" },
            { label: "Pass",    value: stats.pass,    color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "Fail",    value: stats.fail,    color: "text-red-600",   bg: "bg-red-50 border-red-200" },
            { label: "Pending", value: stats.pending, color: "text-gray-500",  bg: "bg-gray-50 border-gray-200" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Execution Progress</span>
            <span>{stats.total - stats.pending} / {stats.total} executed</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${(stats.pass / stats.total) * 100}%` }} />
            <div className="bg-red-500 h-full transition-all"   style={{ width: `${(stats.fail / stats.total) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Pass</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Fail</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Pending</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, ID or module…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Test Case List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">No test cases match your filters.</div>
          )}
          {filtered.map(tc => {
            const overall = getOverallStatus(tc.id, stepStatuses);
            const cfg     = STATUS_CONFIG[overall];
            const Icon    = cfg.icon;
            const isOpen  = !!expanded[tc.id];

            return (
              <div key={tc.id} className={`bg-white rounded-xl border-2 transition-colors ${cfg.border}`}>
                {/* Card header */}
                <button
                  onClick={() => toggleExpand(tc.id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className={`w-5 h-5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{tc.id}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">Table {tc.tableNum}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      {tc.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[tc.priority] || "bg-gray-100 text-gray-500"}`}>
                          {tc.priority}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 text-sm leading-snug">
                      TC-{String(tc.num).padStart(2, "0")} — {tc.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{tc.module}</div>
                  </div>
                  <div className="flex-shrink-0 text-gray-400 mt-1">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                    {/* Meta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-700">Description: </span>
                        {tc.description}
                      </div>
                      <div className="space-y-1">
                        <div><span className="font-semibold text-gray-700">Pre-condition: </span>{tc.preCondition}</div>
                        <div><span className="font-semibold text-gray-700">Post-condition: </span>{tc.postCondition}</div>
                        <div><span className="font-semibold text-gray-700">Designed by: </span>{tc.designer} &nbsp;·&nbsp; {tc.designDate}</div>
                      </div>
                    </div>

                    {/* Steps table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[10px]">
                            <th className="text-left px-3 py-2 w-8 font-semibold">#</th>
                            <th className="text-left px-3 py-2 font-semibold">Test Step</th>
                            <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Test Data</th>
                            <th className="text-left px-3 py-2 font-semibold">Expected Result</th>
                            <th className="text-center px-3 py-2 font-semibold w-28">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tc.steps.map((s, idx) => {
                            const st  = stepStatuses[tc.id][s.step];
                            const sCfg = STATUS_CONFIG[st];
                            const SIcon = sCfg.icon;
                            return (
                              <tr key={s.step} className={`border-t border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                                <td className="px-3 py-2.5 text-gray-400 font-medium">{s.step}</td>
                                <td className="px-3 py-2.5 text-gray-700">{s.testStep}</td>
                                <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{s.testData || "—"}</td>
                                <td className="px-3 py-2.5 text-gray-700">{s.expectedResult}</td>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() => cycleStepStatus(tc.id, s.step)}
                                    title="Click to cycle: Pending → Pass → Fail"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium transition-all hover:opacity-80 cursor-pointer ${sCfg.bg} ${sCfg.text} ${sCfg.border}`}
                                  >
                                    <SIcon className="w-3 h-3" />
                                    {sCfg.label}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Click a status badge to cycle: Pending → Pass → Fail</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
