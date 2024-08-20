// adminAuthMiddleware.js

const Admin = require('../models/Admin'); // Assuming you have the Admin model
const argon2 = require('argon2'); // Assuming you are using argon2 for password hashing
const secretKey = 'your-secret-key';
const jwt = require('jsonwebtoken');
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Extract the authentication token from the Authorization header
    const authToken = req.headers.authorization;

    // Check if the token is present
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized - Token not provided' });
    }

    // Extract admin credentials from the token (you may use a library like jsonwebtoken for this)
    // For simplicity, assuming the token is a Bearer token and only contains the email
    const [, token] = authToken.split(' '); // Split 'Bearer <token>'
   
    const decodedToken = decodeToken(token);

    // Find the admin by email
    const admin = await Admin.findOne({ _id: decodedToken.id });

    // If admin not found, return 401 Unauthorized
    if (!admin) {
      return res.status(401).json({ message: 'Unauthorized - Invalid admin credentials' });
    }
    // Attach admin details to the request for further processing
    req.lab =  admin.lab,
     

    // Call next() to proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle errors, if any
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Example function to decode the token (you may need to replace this with your actual token decoding logic)
const decodeToken = (token) => {
    try {
      // Verify the token and get the decoded payload
      const decodedToken = jwt.verify(token, secretKey); // Replace 'your-secret-key' with your actual secret key
      // Log the decoded token
  
      return decodedToken;
    } catch (error) {
      console.error('Error decoding token:', error);
      throw error; // Rethrow the error after logging
    }
  };
  

module.exports = adminAuthMiddleware;
