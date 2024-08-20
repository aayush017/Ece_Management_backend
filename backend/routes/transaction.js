const express = require("express");
const router = express.Router();
const {
  createRequest,
  acceptRequest,
  declineRequest,
  confirmTransaction,
  getAllRequests,
  getRequestByStudentIDs,
  createReturnRequest,
  deleteRequest
} = require("../controllers/transactionController");

const transactionAuthMiddleware = require("../middleware/transactionAuth");
const adminAuthMiddleware =require('../middleware/adminAuth');

router.post("/requests",transactionAuthMiddleware, createRequest);
router.delete("/requests/delete",transactionAuthMiddleware, deleteRequest); 
router.get("/srequests/:studentId",transactionAuthMiddleware, getRequestByStudentIDs);
router.post("/return",transactionAuthMiddleware, createReturnRequest);

router.put("/accept/:transactionId", adminAuthMiddleware, acceptRequest);
router.put("/decline/:transactionId", adminAuthMiddleware, declineRequest);
router.put("/transactions/confirm/:transactionId", adminAuthMiddleware, confirmTransaction);
router.get("/requests/:status/:lab/:studentID", adminAuthMiddleware, getAllRequests); // Used to fetch students who current equip any item from any/particular lab (used this in Admin DashBoard page)
router.get("/requests/:status/:lab", adminAuthMiddleware, getAllRequests); // This function is used to fetch all borrow, return and completed transaction request to a particular lab



module.exports = router;
