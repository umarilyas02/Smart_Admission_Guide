import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP',
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Use the OTP below to reset your password:</p>
      <h2 style="background-color: #f0f0f0; padding: 10px; text-align: center; letter-spacing: 5px;">${otp}</h2>
      <p>This OTP expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    console.log('Attempting to send email to:', email);
    console.log('Using email service:', process.env.EMAIL_SERVICE);
    console.log('From email:', process.env.EMAIL_USER);
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Smart Admission Guide',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Your account has been created successfully.</p>
      <p>You can now log in with your email and password.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
