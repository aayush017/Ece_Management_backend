// authRoutes.js
const express = require('express');
const router = express.Router();
const { adminLogin, studentLogin, addStudent, addAdmin, sendOtp, verifyOtp, students, forgotPassword, disableStudent, getDisablesStudentLogs } = require('../controllers/authController');
const adminAuthMiddleware = require('../middleware/adminAuth');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

// Existing routes
router.post('/admin', adminLogin);
router.post('/student', studentLogin);
router.post('/addStudent', addStudent);
router.post('/addAdmin', addAdmin);
router.post('/sendotp', sendOtp);
router.post('/verifyotp', verifyOtp);
router.post('/forgotPassword', forgotPassword);
router.get('/students/:year', adminAuthMiddleware, students);
router.post('/disableStudent', adminAuthMiddleware, disableStudent);
router.get('/dueslogs/:year', adminAuthMiddleware, getDisablesStudentLogs);

// Google OAuth route
const client = new OAuth2Client('517938499008-aoe60m0r5ffhdnrq9jp5ejgtu3irs89u.apps.googleusercontent.com');

router.post('/google', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '517938499008-aoe60m0r5ffhdnrq9jp5ejgtu3irs89u.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Check if user exists in Admin or Student collection
    let user = await Admin.findOne({ email }) || await Student.findOne({ email });

    // If user doesn't exist, decide whether to create as Admin or Student
    if (!user) {
      // Here, we are assuming to create a new Student. Adjust if needed.
      user = await Student.create({ 
        email, 
        fullName: name, 
        rollNumber: sub, // Assuming 'sub' as a unique identifier
        password: '', // You may want to handle password setup securely
        graduationType: 'btech', // Default or based on your logic
        branch: 'cse', // Default or based on your logic
        graduationYear: new Date().getFullYear() + 4 // Assuming a 4-year course
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user._id, role: user instanceof Admin ? 'admin' : 'student' }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Error during token verification:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
