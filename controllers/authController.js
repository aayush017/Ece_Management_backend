const Admin = require('../models/Admin');
const Student = require('../models/Student');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const nodemailer = require( 'nodemailer' );
const otpGenerator = require( 'otp-generator' );
const { findById } = require('../models/Transaction');
const otpStorage = new Map();
const secretKey = 'your-secret-key'; // Replace with your actual secret key

// Function to generate a JWT token
function generateToken(payload) {
  return jwt.sign(payload, secretKey, { expiresIn: '4h' });
}

// Function to generate and store OTP
const generateAndStoreOTP = (email, otp) => {
  const expirationTime = 3 * 60 * 1000; // OTP valid for 3 minutes
  // Store the OTP along with its expiration time
  otpStorage.set(email, otp);


  setTimeout(() => {
    otpStorage.delete(email);
  }, expirationTime); // Remove OTP after 5 minutes
};

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'noreply-ecelabims@iiitd.ac.in',
    pass: 'cfoq swku iskc weoo', // use env file for this data , also kuch settings account ki change krni padti vo krliyo
  },
});

const sendOtp = async (req, res) => {
  const { email_id } = req.body;
  let otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  generateAndStoreOTP(email_id, otp);

  // Create an HTML file with the OTP and other data
  const htmlContent = `
    <html>
      <head>
        <style>
          /* Add your styles here */
        </style>
      </head>
      <body>
        <h1>OTP Verification</h1>
        <p>Your OTP for verification is: <strong>${otp}</strong></p>
      </body>
    </html>
  `;

  // Send OTP via email with the HTML content
  const mailOptions = {
    from: 'noreply-ecelabims@iiitd.ac.in',
    to: email_id,
    subject: 'OTP Verification',
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, enteredOTP } = req.body;
  const storedOTP = otpStorage.get(email);

  if (!storedOTP || storedOTP.toString() !== enteredOTP.toString()) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  res.status(200).json({ success: true, message: 'OTP verified successfully' });
};



// Register a new student
const addStudent = async (req, res) => {
  try {
    const { email, password, fullName, rollNumber, graduationType, branch, graduationYear, contactNumber } = req.body;

    // Check if student with the same email or rollNumber already exists
    const existingStudent = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with the same email or rollNumber already exists' });
    }

    // Hash the password using Argon2 before saving it to the database
    const hashedPassword = await argon2.hash(password);

    // Assign the current time as the enrollment date
    const enrollmentDate = new Date();

    // Create a new student instance
    const newStudent = new Student({
      email,
      password: hashedPassword,
      fullName,
      rollNumber,
      graduationType,
      branch,
      graduationYear,
      enrollmentDate,
      contactNumber,
    });

    // Save the new student to the database
    await newStudent.save();

    res.status(201).json({ message: 'Student added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Student Login
const studentLogin = async (req, res) => {
  const { email, password } = req.body;
  const student = await Student.findOne({ email });

  if (!student) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

   // Check if clearDues is false for the student
   if (student.clearDues) {
    return res.status(401).json({ success: false, message: 'You account has been terminated by Admin' });
  }

  const validPassword = await argon2.verify(student.password, password);
  if (!validPassword) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const tokenPayload = {
    id: student._id,
    email: student.email,
    role: 'student',
  };

  const authtoken = generateToken(tokenPayload);
  const success = true;

  res.status(200).json({ success, authtoken, message: 'Student login successful' });
};

// Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const validPassword = await argon2.verify(admin.password, password);
  if (!validPassword) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const tokenPayload = {
    id: admin._id,
    username: admin.username,
    lab: admin.lab,
    role: 'admin',
  };

  const authtoken = generateToken(tokenPayload);
  const success = true;

  res.status(200).json({ success,authtoken, message: 'Admin login successful' });
};

const addAdmin = async (req, res) => {
  try {
    const { username, password, lab, email, fullName } = req.body;
    // Check if admin with the same username or email already exists
    const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with the same username or email already exists' });
    }
    // Hash the password using Argon2 before saving it to the database
    const hashedPassword = await argon2.hash(password);
    // Create a new admin instance
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      lab,
      email,
      fullName,
    });
    // Save the new admin to the database
    await newAdmin.save();
    res.status(201).json({ message: 'Admin added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// This function fetch all students registered to the portal who have not cleared their dues yet
const students = async (req, res) => {
  try {
    // Check if the request is authenticated
    if (!req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }

    const {year} = req.params;
    const searchStudent = req.query.searchStudent;
    let baseQuery = {};
    baseQuery.clearDues = false;
    if (year !== 'All'){
      baseQuery.graduationYear = year;
    }
    if (searchStudent !== ''){
      delete baseQuery.graduationYear;
      baseQuery.$or = [
        { fullName: { $regex: searchStudent, $options: 'i' } }, // Case-insensitive search for fullName
        { rollNumber: { $regex: searchStudent, $options: 'i' } } // Case-insensitive search for rollNumber
      ];
    }
    // Fetch all students from the database
    const students = await Student.find(baseQuery, '-password'); // Exclude the password field from the response

    // Send the list of students in the response
    res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const forgotPassword = async(req, res) => {
  try {
    const {email , password, user} = req.body;

    if (user === 'student'){
      const student = await Student.findOne({ email });
      if(!student){
        return res.status(400).json({ success: false, message: 'No user registed with this Email Id' })
      }
      const hashedPassword = await argon2.hash(password);
      student.password = hashedPassword;
      await student.save();
      return res.status(200).json({success:true, message:"password updated successfully"});
    }

    if (user === 'admin'){
      const admin = await Admin.findOne({ email });
      if(!admin){
        return res.status(400).json({ success: false, message: 'No user registed with this Email Id' })
      }
      const hashedPassword = await argon2.hash(password);
      admin.password = hashedPassword;
      await admin.save();
      return res.status(200).json({success:true, message:"password updated successfully"});
    }

    return res.status(400).json({ success: false, message: 'Invalid user type' })
    
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}


const disableStudent = async (req, res) => {
  try {
    const { studentID } = req.body;
    const lab = req.lab;
    const student = await Student.findById(studentID);
    const admin = await Admin.findOne({lab: lab});

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Unauthorized user' });
    }
    if (!student) {
      return res.status(400).json({ success: false, message: 'No user registered with this Student ID' });
    }

    student.clearDues = true;
    student.duesClearedBy = admin;
    student.duesClearedOn = new Date();
    await student.save();

    res.status(200).json({ success: true, message: 'Dues cleared successfully' });
  } catch (error) {
    console.error('Error clearing dues:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getDisablesStudentLogs = async (req, res) => {
  try{
    const lab = req.lab;
    const {year} = req.params;
    const searchStudent = req.query.searchStudent;
    const admin = await Admin.findOne({lab: lab});

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Unauthorized user' });
    }
    let baseQuery = {};
    baseQuery.clearDues = true;

    // Only apply year filter when there is no search query
    if (year !== 'All' && searchStudent === ''){
      // Parse the year from req.params and create start and end dates
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      baseQuery.duesClearedOn = { $gte: startDate, $lte: endDate };
    }

    if (searchStudent !== ''){
      baseQuery.$or = [
        { fullName: { $regex: searchStudent, $options: 'i' } }, // Case-insensitive search for fullName
        { rollNumber: { $regex: searchStudent, $options: 'i' } } // Case-insensitive search for rollNumber
      ];
    }

    const disabledStudents = await Student.find(baseQuery,'-password');
    duesLogs = []
    for (const i of disabledStudents){
      data = {};
      data.student = i;
      const clearedBy = await Admin.findById(i.duesClearedBy);
      data.admin = clearedBy.username;
      duesLogs.push(data);
    }
    res.status(200).json({ success: true, data: duesLogs });
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

module.exports = { studentLogin, adminLogin, addStudent, addAdmin,sendOtp, verifyOtp,students, forgotPassword, disableStudent, getDisablesStudentLogs};
