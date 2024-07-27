const mongoose = require('mongoose');

// Define the lab enumeration values
const labEnum = ["lab1", "lab2", "lab3","lab4", "None"];

// Define the equipment schema
const equipmentLogSchema = new mongoose.Schema({
  currentName: {
    type: String,
    required: true,
  },
  oldName: {
    type: String,
    default: 'None',
    required: true,
  },
  currentLab: {
    type: String,
    enum: labEnum,
    required: true,
  },
  oldLab: {
    type: String,
    enum: labEnum,
    default: 'None',
    required: true,
  },
  currentQuantity: {
    type: Number,
    required: true,
  },
  oldQuantity: {
    type: Number,
    default: 0,
    required: true,
  },
  currentType:{
    type:String,
    default:'Miscellaneous',
    required:true,
  },
  oldType:{
    type:String,
    default:'None',
    required:true,
  },
  dateOfChange: {
    type: Date,
    required: true,
  }

});

// Create the equipment model
const Equipment = mongoose.model('EquipmentLog', equipmentLogSchema);

module.exports = Equipment;