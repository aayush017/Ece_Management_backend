const Transaction = require("../models/Transaction");
const Equipment = require("../models/Equipment");
const Student = require("../models/Student");
const Admin = require('../models/Admin');
const asyncHandler = require("express-async-handler");
const nodemailer = require( 'nodemailer' );
const cron = require('node-cron');


const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "noreply-ecelabims@iiitd.ac.in",
    pass: "cfoq swku iskc weoo", // use env file for this data , also kuch settings account ki change krni padti vo krliyo
  },
});

const sendReturnReminderEmail = async (studentEmail, studentName, equipmentName, quantity, date) => {
  const subject = 'Return Reminder';
  const htmlContent = `
    <html>
      <head>
        <style>
          /* Add your styles here */
        </style>
      </head>
      <body>
        <p>Dear ${studentName},</p>
        <p>This is a reminder to return the equipment ${equipmentName} (${quantity} units).</p>
        <p>Due date: ${date}</p>
        <p>Thank you!</p>
      </body>
    </html>
  `;
  
  const mailOptions = {
    from: 'noreply-ecelabims@iiitd.ac.in',
    to: studentEmail,
    subject: subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

// Send email for student request to admin
const studentRequestMail = asyncHandler(
  async (studentEmail, studentName, studentRollNo, studentContact, adminEmail, equipmentName, quantity, requestType) => {
    let subject = `Equipment ${requestType} request`;
    let mailText = 'Borrow';

    if(requestType === 'borrow'){
      mailText = 'Borrow';
    }
    else{
      mailText = 'Return';
    }
    const htmlContent = `
      <html>
        <head>
          <style>
            /* Add your styles here */
          </style>
        </head>
        <body>
          <h2>Student:</h2>
          
          <p><strong>Email:</strong> ${studentEmail}</p>
          <p><strong>Name:</strong> ${studentName}</p>
          <p><strong>Roll No.</strong> ${studentRollNo}</p>
          <p><strong>Contact</strong> ${studentContact}</p>

          <h2>${mailText} Requested for:</h2>
          <p><strong>Equipment:</strong> ${equipmentName}</p>
          <p><strong>Qunatity:</strong> ${quantity}</p>
        </body>
      </html>
    `;
    const mailOptions = {
      from: "noreply-ecelabims@iiitd.ac.in",
      to: [adminEmail,studentEmail], // Use an array for multiple recipients
      subject: subject,
      html: htmlContent,
    };

    transporter.sendMail(mailOptions);
  }
);

const requestApprovedAndDeclinedMail = asyncHandler(
  async (studentEmail, studentName, studentRollNo, studentContact, adminEmail, equipmentName, quantity, requestType, adminresponse) => {

    let AdminResponse = "Approval";
    let mailText = "Approved"
    if (adminresponse === "Approval") {
      AdminResponse = "Approval";
      mailText = "Approved";
    }
    if (adminresponse === "Decline") {
      AdminResponse = "Decline";
      mailText = "Declined";
    }
    let subject = `${AdminResponse} of ${requestType} request`;

    const htmlContent = `
      <html>
        <head>
          <style>
            /* Add your styles here */
          </style>
        </head>
        <body>
          <h2>Student:</h2>
          
          <p><strong>Email:</strong> ${studentEmail}</p>
          <p><strong>Name:</strong> ${studentName}</p>
          <p><strong>Roll No.</strong> ${studentRollNo}</p>
          <p><strong>Contact</strong> ${studentContact}</p>

          <h2>${mailText} Requested for:</h2>
          <p><strong>Equipment:</strong> ${equipmentName}</p>
          <p><strong>Qunatity:</strong> ${quantity}</p>
        </body>
      </html>
    `;
    const mailOptions = {
      from: "noreply-ecelabims@iiitd.ac.in",
      to: [adminEmail, studentEmail], // Use an array for multiple recipients
      subject: subject,
      html: htmlContent,
    };

    transporter.sendMail(mailOptions);
  }
);

//create a borrow request
const createRequest = async (req, res) => {
  try {
    const {  equipmentId, quantity, daysToUse, lab, studentComment} = req.body;
    const studentId= req.student
    const equipment = await Equipment.findById(equipmentId);
    const admin = await Admin.findOne({lab});

    // Check if the request is authenticated
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(400).json({ error: "Student not found" });
    }

    if (!equipment) {
      return res.status(400).json({ error: "Equipment not found" });
    }

    // Check if equipment quantity is sufficient for the request
    if (equipment.quantity < quantity) {
      return res.status(400).json({ error: "Not enough equipment available" });
    }

    // Calculate the return date based on the number of days to use
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + daysToUse);
    const request = new Transaction({
      student: studentId,
      equipment: equipmentId,
      quantity,
      returnDate,
      lab,
      status: "requested",
      studentComment: studentComment
    });
    
    await request.save();

    studentRequestMail(student.email, student.fullName, student.rollNumber, student.contactNumber, admin.email, equipment.name, quantity, "borrow");
    res.status(201).json(request);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while creating the request" });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const userId=req.student

    let request = await Transaction.findById(transactionId);

   
    if (!request) {
      return res.status(400).json({ error: "Request not found" });
    }

    // Check if the request status is 'requested' before declining
    if (request.status !== "requested" && request.status !== "returning") {
      return res.status(400).json({ error: "Invalid request status" });
    }

    // Check if the transaction is made by the specified user
    if (request.student.toString() !== userId.toString()) {

      return res.status(403).json({ error: "Unauthorized to decline this request" });
    }


    // // Remove the request from the database
    // await request.remove();
    await request.deleteOne();

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while deleting the request" });
  }
};


// Accept a borrow request (Admin)
const acceptRequest = async (req, res) => {
  
  try {
    const { transactionId } = req.params;
    const {remark} = req.body;
    const request = await Transaction.findById(transactionId);
    const student = await Student.findById(request.student);
    const equipment = await Equipment.findById(request.equipment);
    const lab = request.lab;
    const admin = await Admin.findOne({ lab: lab});

    // Check if the request is authenticated
    if (!req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }

    if (!request) {
      return res.status(400).json({ error: "Request not found" });
    }

    // Check if the request status is 'requested' before accepting
    if (request.status !== "requested" && request.status !== "returning") {
      return res.status(400).json({ error: "Invalid request status" });
    }

    if(request.status === "requested"){
      // Add transactionId to student's equippedItemTransaction array
      request.status = "accepted";
      equipment.quantity -= request.quantity;

      await Promise.all([request.save(), equipment.save(), student.save()]);
      requestApprovedAndDeclinedMail(student.email, student.fullName, student.rollNumber, student.contactNumber, admin.email, equipment.name, request.quantity, "borrow", "Approval");
    }
    else{
      request.status = "completed";
      equipment.quantity += request.quantity;
      request.adminComments = remark;
      request.returnedOn = new Date(); // Set returnedOn to the current date

      await Promise.all([request.save(), equipment.save(), student.save()]);
      requestApprovedAndDeclinedMail(student.email, student.fullName, student.rollNumber, student.contactNumber, admin.email, equipment.name, request.quantity, "return", "Approval");
    }
    res.status(200).json(request);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while accepting the request" });
  }
};

// Decline a borrow request (Admin)
const declineRequest = async (req, res) => {
  try {

    // Check if the request is authenticated
    if (!req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }

    const { transactionId } = req.params;

    const request = await Transaction.findById(transactionId);
    const student = await Student.findById(request.student);
    const equipment = await Equipment.findById(request.equipment);
    const lab = request.lab;
    const admin = await Admin.findOne({lab: lab});
    if (!request) {
      return res.status(400).json({ error: "Request not found" });
    }

    // Check if the request status is 'requested' before declining
    if (request.status !== "requested" && request.status !== "returning") {
      return res.status(400).json({ error: "Invalid request status" });
    }

    if(request.status === 'requested'){
      request.status = "declined";
      await request.save();
      requestApprovedAndDeclinedMail(student.email, student.fullName, student.rollNumber, student.contactNumber, admin.email, equipment.name, request.quantity, "borrow", "Decline");
    }
    else{
      request.status = "accepted";
      await request.save();
      requestApprovedAndDeclinedMail(student.email, student.fullName, student.rollNumber, student.contactNumber, admin.email, equipment.name, request.quantity, "return", "Decline");
      
    }

    res.json(request);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while declining the request" });
  }
};

// Fetch all requests
// This function is used to fetch all borrow and return request to a particular lab
// Also used to fetch students who current equip any item from any/particular lab
const getAllRequests = async (req, res) => {
  
  // Check if the request is authenticated
  if (!req.lab) {
    return res.status(401).json({ message: 'Unauthorized - Access denied' });
  }

  const { status,lab, studentID } = req.params;
  const year = req.query.year;
  const studentEmail = req.query.studentEmail;
  
  let baseQuery = {};
  if (status) {
    const statusArray = status.split(","); // Split the comma-separated string into an array
    baseQuery.status = { $in: statusArray }; // Use $in operator to match any of the provided statuses
  }
  if (studentID){
    baseQuery.student = studentID;
  }
  if (lab != "All"){
    baseQuery.lab = lab;
  }


  if (year !== undefined && year !== 'All' && studentEmail === ''){
    // Parse the year from req.params and create start and end dates
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    baseQuery.returnedOn = { $gte: startDate, $lte: endDate };
  }

  if (studentEmail !== undefined && studentEmail !== ''){
    const idOfSearchedStudent = await Student.find({email: studentEmail})
    baseQuery.student = idOfSearchedStudent
  }

  try {
    const Rrequests = await Transaction.find(baseQuery);

    // Assuming that each request has a reference to student and equipment by _id
    const studentIds = Rrequests.map((request) => request.student);
    const equipmentIds = Rrequests.map((request) => request.equipment);

    // Fetch all students based on the array of student IDs
    const students = [];
    for (const studentId of studentIds) {
      const student = await Student.findById(studentId);
      if (student) {
        students.push(student);
      }
    }
    // Fetch all equipments based on the array of equipment IDs
    const equipments = [];
    for (const equipmentId of equipmentIds) {
      const equipment = await Equipment.findById(equipmentId);
      if (equipment) {
        equipments.push(equipment);
      }
    }

    res.status(200).json({ Rrequests: Rrequests, students: students, equipments: equipments });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching requests" });
  }
};

// Fetch borrow requests by student id and request status
const getRequestByStudentIDs = async (req, res) => {
  try {
    const studentId  = req.student;
    const { status } = req.query;

    // Create a base query with the student ID
    const baseQuery = { student: studentId };

    // If a status is provided in the query, split it into an array and add it to the query conditions
    if (status) {
      const statusArray = status.split(","); // Split the comma-separated string into an array
      baseQuery.status = { $in: statusArray }; // Use $in operator to match any of the provided statuses
    }

    // Fetch requests based on the modified query
    const requests = await Transaction.find(baseQuery);

    const equipmentIds = requests.map((request) => request.equipment);

    // Fetch all equipments based on the array of equipment IDs
    const equipments = [];
    for (const equipmentId of equipmentIds) {
      const equipment = await Equipment.findById(equipmentId);
      if (equipment) {
        equipments.push(equipment);
      }
    }

    res.status(200).json({ requests, equipments });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching requests" });
  }
};

// Confirm a transaction (Admin)
const confirmTransaction = async (req, res) => {

  try {
    // Check if the request is authenticated
    if (!req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(400).json({ error: "Transaction not found" });
    }

    // Check if the transaction status is 'active' before confirming
    if (transaction.status !== "active") {
      return res.status(400).json({ error: "Invalid transaction status" });
    }

    transaction.status = "ended";

    const equipment = await Equipment.findById(transaction.equipment);
    equipment.quantity += transaction.quantity;

    await Promise.all([transaction.save(), equipment.save()]);

    res.json(transaction);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while confirming the transaction" });
  }
};

// Create Return request (Student)
const createReturnRequest = async (req, res) => {
  try {
    const {  transactionId } = req.body;
    const studentId = req.student

    const transaction = await Transaction.findById(transactionId);
    const equipment = await Equipment.findById(transaction.equipment);
    const admin = await Admin.findOne({lab: transaction.lab});
    if (!transaction) {
      return res.status(400).json({ error: "Transaction not found" });
    }
    
    const student = await Student.findById(studentId);
    if (!student || transaction.student.toString() != studentId.toString()) {
      return res.status(400).json({ error: "Student not found" });
    }

    if (transaction.status !== "accepted") {
      return res.status(400).json({ error: "Invalid request status" });
    }

    transaction.status = "returning";
    transaction.returnedOn = new Date();
    await transaction.save(); // Use await directly on the save method

    res.status(200).json(transaction);
    studentRequestMail(student.email, student.fullName, student.rollNumber, student.contactNumber, admin.email, equipment.name, transaction.quantity, "return");
  } catch (error) {
    console.error("Error returning equipment:", error);
    res
      .status(500)
      .json({ error: "An error occurred while returning the equipment" });
  }
};

// Schedule a cron job to run at 11:59 pm every day
cron.schedule('16 11 * * *', async () => {
  try {
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString().split('T')[0];

    // Find transactions with returnDate matching the current date
    const currentDayTransactions = await Transaction.find({
      returnDate: { $gte: formattedCurrentDate, $lt: new Date(formattedCurrentDate + 'T23:59:59.999Z') },
      returnedOn: null,
      status: 'accepted'
    });

    // Send return reminder emails to the students for the current day
    for (const transaction of currentDayTransactions) {
      const student = await Student.findById(transaction.student);
      const equipment = await Equipment.findById(transaction.equipment);
      if (student) {
        sendReturnReminderEmail(student.email, student.fullName, equipment.name, transaction.quantity, formattedCurrentDate);
      }
    }

    // Calculate one day before
    const beforeDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find transactions with returnDate matching one day before
    const oneDayBeforeTransactions = await Transaction.find({
      returnDate: { $gte: beforeDate, $lt: new Date(beforeDate + 'T23:59:59.999Z') },
      returnedOn: null
    });

    // Send return reminder emails to the students for one day before
    for (const transaction of oneDayBeforeTransactions) {
      const student = await Student.findById(transaction.student);
      const equipment = await Equipment.findById(transaction.equipment);
      if (student) {
        sendReturnReminderEmail(student.email, student.fullName, equipment.name, transaction.quantity, beforeDate);
      }
    }

    // Calculate one day after
    const afterDate = new Date(currentDate);
    afterDate.setDate(afterDate.getDate() - 1);
    const formattedAfterDate = afterDate.toISOString().split('T')[0];

    // Find transactions with returnDate matching one day after
    const oneDayAfterTransactions = await Transaction.find({
      returnDate: { $gte: formattedAfterDate, $lt: new Date(formattedAfterDate + 'T23:59:59.999Z') },
      returnedOn: null
    });

    // Send return reminder emails to the students for one day after
    for (const transaction of oneDayAfterTransactions) {
      const student = await Student.findById(transaction.student);
      const equipment = await Equipment.findById(transaction.equipment);
      if (student) {
        sendReturnReminderEmail(student.email, student.fullName, equipment.name, transaction.quantity, formattedAfterDate);
      }
    }
  } catch (error) {
    console.error('Error while sending return reminder emails:', error);
  }
});


module.exports = {
  createRequest,
  acceptRequest,
  declineRequest,
  confirmTransaction,
  getAllRequests,
  getRequestByStudentIDs,
  createReturnRequest,
  deleteRequest
};
