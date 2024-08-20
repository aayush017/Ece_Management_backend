const express = require('express');
const {
  addEquipments,
  getEquipmentsByLab,
  updateEquipments,
  getAllEquipments,
  getEquipmentLog,
  deleteEquipments,
} = require('../controllers/equipmentsController');
const router = express.Router();

const adminAuthMiddleware =require('../middleware/adminAuth');
const transactionAuthMiddleware = require("../middleware/transactionAuth");

router.post('/equipments',adminAuthMiddleware, addEquipments);
router.get('/equipments', transactionAuthMiddleware, getAllEquipments);
router.get('/equipments/:labName', adminAuthMiddleware, getEquipmentsByLab);
router.put('/equipments/:id', adminAuthMiddleware, updateEquipments);
router.delete('/equipments/:id', adminAuthMiddleware, deleteEquipments);
router.get('/equipmentLog/:lab/:year', adminAuthMiddleware, getEquipmentLog);


module.exports = router;
