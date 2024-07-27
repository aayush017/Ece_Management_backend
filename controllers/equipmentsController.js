const Equipment = require('../models/Equipment'); // Assuming you have the Equipment model
const EquipmentLog = require('../models/Equipment_Log');

// Add Equipment
const addEquipments = async (req, res) => {
  try {
    const equipmentsData = req.body; // Assuming req.body is an array of JSON objects

    // Iterate over each equipment data
    const createdEquipments = [];
    for (const equipmentData of equipmentsData) {
      const { name, lab, description, link, quantity, type } = equipmentData;

      // Check if the request is authenticated
      if (!req.lab) {
        return res.status(401).json({ message: 'Unauthorized - Lab mismatch' });
      }

      const newEquipment = new Equipment({ name, lab, description, link, quantity, type });
      await newEquipment.save();
      createdEquipments.push(newEquipment);

      // Creating new log entry for newly add equipment
      const dateOfCreation = new Date();
      const newEquipmentLog = new EquipmentLog({
        currentName: name,
        oldName: 'None',
        currentLab: req.lab,
        oldLab: 'None',
        currentQuantity: quantity,
        oldQuantity: 0,
        currentType: type,
        oldType: 'None',
        dateOfChange: dateOfCreation
      });
      await newEquipmentLog.save();
    }

    res.status(201).json({ message: 'Equipment(s) created successfully', equipments: createdEquipments });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'An error occurred while adding the equipment' });
  }
};


// Retrieve Equipment by Lab
const getEquipmentsByLab = async (req, res) => {
  const labName = req.params.labName;
  try {  
    // Check if the request is authenticated
    if (labName !== req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }

    const equipmentList = await Equipment.find({ lab: labName });
    res.json(equipmentList);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching equipment data by lab' });
  }
};

// Retrieve All Equipment
const getAllEquipments = async (req, res) => {
  try {
    // Check if the request is authenticated
    if (!req.student) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }
    const allEquipment = await Equipment.find();
    res.json(allEquipment);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching all equipment' });
  }
};

// Update Equipment by ID
const updateEquipments = async (req, res) => {
  try {
    const equipmentId = req.params.id;
    const { name, lab, description, link, quantity, type } = req.body;
    if (!req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Lab mismatch' });
    }
    const equipmentOldDetails = await Equipment.findById(equipmentId);
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      equipmentId,
      { name, lab, description, link, quantity, type },
      { new: true }
    );
    
    // Creating new log entry for change in equipment details
    if (updatedEquipment){
      const dateOfChange = new Date();
      const newEquipmentLog = new EquipmentLog({
        currentName: name,
        oldName: equipmentOldDetails.name,
        currentLab: lab,
        oldLab: equipmentOldDetails.lab,
        currentQuantity: quantity,
        oldQuantity: equipmentOldDetails.quantity,
        currentType: type,
        oldType: equipmentOldDetails.type,
        dateOfChange: dateOfChange
      });
      await newEquipmentLog.save();
    }

    res.json({ message: 'Equipment updated successfully', equipment: updatedEquipment });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the equipment' });
  }
};

// Delete Equipment by ID
const deleteEquipments = async (req, res) => {
  try {
    // Check if the request is authenticated
    if (!req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Access denied' });
    }
    // Proceed with deleting the equipment
    const equipmentId = req.params.id;
    await Equipment.findByIdAndRemove(equipmentId);
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the equipment' });
  }
};

// get equipment logs

const getEquipmentLog = async (req, res) => {
  const {lab, year} = req.params;
  const searchEquipment = req.query.searchEquipment;
  try {
    if (lab !== req.lab) {
      return res.status(401).json({ message: 'Unauthorized - Lab mismatch' });
    }
    let baseQuery = {};
    baseQuery.currentLab = req.lab;

    // Only apply year filter when there is no search query
    if (year !== 'All' && searchEquipment === ''){
      // Parse the year from req.params and create start and end dates
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      baseQuery.dateOfChange = { $gte: startDate, $lte: endDate };
    }
    if (searchEquipment !== ''){
      baseQuery.$or = [
        { oldName: { $regex: searchEquipment, $options: 'i' } }, // Case-insensitive search for oldName
        { currentName: { $regex: searchEquipment, $options: 'i' } } // Case-insensitive search for currentName
      ];
    }
    const allEquipmentLogs = await EquipmentLog.find(baseQuery);
    res.json(allEquipmentLogs);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching equipment's Logs" });
  }
};


module.exports = { deleteEquipments, getEquipmentsByLab, addEquipments, updateEquipments, getAllEquipments, getEquipmentLog};
