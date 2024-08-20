import React, { useEffect, useState } from 'react';
import { BiSolidEditAlt } from 'react-icons/bi';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { RxCross2 } from 'react-icons/rx';
import { PiCheckBold } from 'react-icons/pi';
import Swal from 'sweetalert2';
import Modal from "react-modal";
import ClipLoader from "react-spinners/ClipLoader";
import * as XLSX from 'xlsx';
import {AiOutlineSearch} from "react-icons/ai";

const EquipmentTable = ({user}) => {
  const [equipmentData, setEquipmentData] = useState([]);
  const [editingRow, setEditingRow] = useState(-1);
  const [addingEquipment, setAddingEquipment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem(user.id);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const Host = '192.168.3.169/';

  useEffect(() => {
    setLoading(true); fetchEquipmentData();
  }, []);

  const fetchEquipmentData = async () => {
    
    try {

      const response = await fetch(`192.168.3.169/api/equipment/equipments/${user.lab}`,{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }});
      const data = await response.json();
      setEquipmentData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      alert(error);
      console.error('Error fetching equipment data: ', error);
    }
  };

  const handleEdit = (rowIndex) => {
    setEditingRow(rowIndex);
  };

  const handleSave = async (rowIndex) => {
    
    try {
      const selectedEquipment = equipmentData[rowIndex];
      const response = await fetch(`192.168.3.169/api/equipment/equipments/${selectedEquipment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedEquipment),
      });

      const data = await response.json();
      if (response.ok) {
        Swal.fire('Updated!', data.message, 'success');
      } else {
        Swal.fire('Error!', data.error, 'error');
      }

      fetchEquipmentData();
      setEditingRow(-1);
    } catch (error) {
      console.error('Error updating equipment data: ', error);
    }
  };

  const handleCancel = () => {
    setEditingRow(-1);
    fetchEquipmentData();
  };

  const handleDelete = async (rowIndex) => {
    
    const selectedEquipment = equipmentData[rowIndex];
    const response = await fetch(`192.168.3.169/api/equipment/equipments/${selectedEquipment._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    fetchEquipmentData();
  };

  const deleteAlert = (rowIndex) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        handleDelete(rowIndex);
        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
      }
    });
  };

  const handleAddEquipment = () => {
    setAddingEquipment(true);
  };

  const renderAddRow = () => {
    return (
      <tr className={`text-center ${addingEquipment ? 'bg-gray-300' : ''}`} key="add-row">
        <td className='border p-2'>New</td>
        <td className='border p-2'>
          <input id="newName" placeholder="Enter name" />
        </td>
        <td className='border p-2'>
          <input id="newLab" placeholder="Enter lab" />
        </td>
        <td className='border p-2'>
          <input id="newDescription" placeholder="Enter description" />
        </td>
        <td className='border p-2'>
          <input id="newLink" placeholder="Upload Link" />
        </td>
        <td className='border p-2'>
          <input id="newQuantity" placeholder="Enter quantity" />
        </td>
        <td className='border p-2'>
          <input id="newType" placeholder="Enter Type" />
        </td>
        <td className='border p-2'>
          <div className='flex justify-center'>
            <button
              className='bg-green-500 text-white px-2 py-1 rounded-md flex items-center mr-1'
              onClick={() => handleSaveNewEquipment()}
            >
              <PiCheckBold /> Add
            </button>
            <button
              className='bg-red-500 text-white px-2 py-1 rounded-md flex items-center'
              onClick={() => handleCancelNewEquipment()}
            >
              <RxCross2 /> Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  };
  

  const handleSaveNewEquipment = async () => {
    try {
      // Collect data from input fields
      const name = document.getElementById('newName').value;
      const lab = document.getElementById('newLab').value.toLowerCase();
      const description = document.getElementById('newDescription').value;
      const link = document.getElementById('newLink').value;
      const quantity = document.getElementById('newQuantity').value;
      const type = document.getElementById('newType').value;

      // Make sure all required fields are filled
      if (!name || !lab || !description || !quantity || !type) {
        Swal.fire('Error!', 'Please fill in all required fields.', 'error');
        return;
      }

      if(lab !== 'lab1' && lab !== 'lab2' && lab !== 'lab3'){
        Swal.fire('Error!', 'Lab could be either lab1, lab2 or lab3.', 'error');
        return;
      }

    const equipmentsData = [
      { name: name, lab: lab, description: description, link: link, quantity: quantity, type: type }];

      // Send a POST request to the backend to add new equipment
      const response = await fetch(`192.168.3.169/api/equipment/equipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(equipmentsData), // Sending array of JSON objects
      });
  
      const data = await response.json();
      if (response.ok) {
        Swal.fire('Added!', data.message, 'success');
      } else {
        Swal.fire('Error!', data.error, 'error');
      }
  
      // Reset the state and fetch the updated equipment data
      setAddingEquipment(false);
      fetchEquipmentData();
    } catch (error) {
      console.error('Error adding new equipment: ', error);
    }
  };
  

  const handleCancelNewEquipment = () => {
    // Reset the state when canceling the addition of new equipment
    setAddingEquipment(false);
  };

  const truncateLink = (link) => {
    try {
      const url = new URL(link);
      const truncatedLink = `${url.protocol}//${url.hostname}${url.pathname.split('/').slice(0, 1).join('/')}`;
  
      return truncatedLink;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return link; // Return the original link if there's an error parsing it
    }
  };

  const renderRow = (equipment, index) => {
    const isEditing = index === editingRow;
    const editingRowClass = 'bg-gray-300';
  
    const handleFieldChange = (e, field) => {
      const updatedEquipmentData = [...equipmentData];
      updatedEquipmentData[index][field] = e.target.value;
      setEquipmentData(updatedEquipmentData);
    };
  
    const isTypeSelected = selectedTypes.length === 0 || selectedTypes.includes(equipment.type);

    const toggleShowFullDescription = () => {
      const updatedEquipmentData = [...equipmentData];
      updatedEquipmentData[index].showFullDescription = !updatedEquipmentData[index].showFullDescription;
      setEquipmentData(updatedEquipmentData);
    };

    const truncatedDescription = equipment.description.split(' ').slice(0, 1).join(' ');
  
    if (
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      isTypeSelected // if it is included in that list
    ) {
      const serialNumber = index + 1;
  
      return (
        <tr className={`text-center ${isEditing ? editingRowClass : ''}`} key={equipment._id}>
          <td className='border p-2'>{serialNumber}</td>
          <td className='border p-2'>
            {isEditing ? (
              <input value={equipment.name} onChange={(e) => handleFieldChange(e, 'name')} />
            ) : (
              equipment.name
            )}
          </td>
          <td className='border p-2'>
            {isEditing ? (
              <input value={equipment.lab} onChange={(e) => handleFieldChange(e, 'lab')} />
            ) : (
              equipment.lab
            )}
          </td>
          <td className='border p-2'>
            {isEditing ? (
              <input value={equipment.description} onChange={(e) => handleFieldChange(e, 'description')} />
            ) : (
              <div>
                {equipment.showFullDescription ? (
                  <>
                  {equipment.description}
                  <button onClick={toggleShowFullDescription} className='text-blue-500'>
                      ...Show Less
                  </button>
                  </>
                ) : (
                  <>
                    {truncatedDescription}{' '}
                    <button onClick={toggleShowFullDescription} className='text-blue-500'>
                      ...Read More
                    </button>
                  </>
                )}
              </div>
            )}
          </td>
          <td className='border p-2'>
            {isEditing ? (
              <input value={equipment.link} onChange={(e) => handleFieldChange(e, 'link')} />
            ) : (
              <a href={equipment.link} target="_blank" rel="noopener noreferrer" className='text-blue-500'>
                {truncateLink(equipment.link)}
              </a>
            )}
          </td>
          <td className='border p-2'>
            {isEditing ? (
              <input value={equipment.quantity} onChange={(e) => handleFieldChange(e, 'quantity')} />
            ) : (
              equipment.quantity
            )}
          </td>
          <td className='border p-2'>
            {isEditing ? (
              <input value={equipment.type} onChange={(e) => handleFieldChange(e, 'type')} />
            ) : (
              equipment.type
            )}
          </td>
          <td className='border p-2'>
            <div className='flex justify-center'>
              {isEditing ? (
                <>
                  <button
                    className='bg-green-500 text-white px-2 py-1 rounded-md flex items-center mr-1'
                    onClick={() => handleSave(index)}
                  >
                    <PiCheckBold /> Save
                  </button>
                  <button
                    className='bg-red-500 text-white px-2 py-1 rounded-md flex items-center'
                    onClick={handleCancel}
                  >
                    <RxCross2 /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className='bg-blue-500 text-white px-2 py-1 rounded-md flex items-center mr-1'
                    onClick={() => handleEdit(index)}
                  >
                    <BiSolidEditAlt /> Edit
                  </button>
                  <button
                    className='bg-red-500 text-white px-2 py-1 rounded-md flex items-center'
                    onClick={() => deleteAlert(index)}
                  >
                    <RiDeleteBin6Line /> Delete
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      );
    }
    return null;
  };
  
  const renderHeaderRow = () => {
    const columnNames = ['S.No', 'Equipment Name', 'Lab', 'Description', 'More Info', 'Quantity','Type', 'Action'];

    return (
      <tr className='bg-[#3dafaa] text-white'>
        {columnNames.map((columnName, index) => (
          <th className='border p-2 text-center' key={index}>
            {columnName}
          </th>
        ))}
      </tr>
    );
  };
  const openFilterModal = () => {
    setShowFilterModal(true);
  };


  const uploadEquipmetXLSX = (event) => {

    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0]; // Assuming the data is in the first sheet.
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (sheetData.length === 0) {
          console.error('No data found in the XLSX file.');
          return;
        }

        const headerRow = Object.keys(sheetData[0]);

        const courses = sheetData.map((rowData) => {
          const mappedCourse = {};
          headerRow.forEach((field) => {
            // Map headers to desired names
            switch (field) {
                case 'Equipment Name':
                    mappedCourse['name'] = rowData[field];
                    break;
                case 'Lab':
                    mappedCourse['lab'] = rowData[field];
                    break;
                case 'Description':
                    mappedCourse['description'] = rowData[field];
                    break;
                case 'More Info':
                    mappedCourse['link'] = rowData[field];
                    break;
                case 'Quantity':
                    mappedCourse['quantity'] = rowData[field];
                    break;
                case 'Type':
                    mappedCourse['type'] = rowData[field];
                    break;
                default:
                    // Do nothing or handle unrecognized headers
                    break;
            }
          });
          return mappedCourse;
        });
        
        const response = await fetch(`192.168.3.169/api/equipment/equipments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(courses), // Sending array of JSON objects
        });
      };
      reader.onerror = (error) => {
        console.error('Error reading XLSX:', error);
      };
      reader.readAsBinaryString(file);
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    const inputElement = e.currentTarget.previousSibling;
    const query = inputElement.value;  // Use a local variable
    setSearchTerm(query);
  }

  return (
    // <div className=''>
      <div className=''>
      <div >
      <div className="flex justify-between my-2 ml-2">
        <div className='flex'>
          <div className="flex items-center">
            <form className="w-[350px]" onSubmit={(e) => e.preventDefault()}>
              <div className="relative mr-2">
                <input
                  type="search"
                  placeholder="Search Equipment..."
                  className="w-full p-4 rounded-full h-10 border border-[#3dafaa] outline-none focus:border-[#3dafaa]"

                />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-[#3dafaa] rounded-full search-button text-white"
                  type="button"
                  onClick={handleSearch}
                >
                  <AiOutlineSearch />
                </button>
              </div>
            </form>
          </div>
          <button
            onClick={openFilterModal}
            className="bg-gray-300 text-gray-600 px-16 py-2 rounded ml-2"
          >
            Filter
          </button>
        </div>
        <div className='flex justify-end mr-2'>
          <button
            className='rounded-full bg-[#3dafaa] text-white border-2 border-[#3dafaa] py-1 px-3 mt-2 mb-1 mr-1 hover:bg-white hover:text-[#3dafaa]'
            onClick={handleAddEquipment}
          >
            Add Equipment
          </button>
         
            {/* Upload XLSX button */}
            <label className="rounded-full bg-[#3dafaa] text-white border-2 border-[#3dafaa] py-1 px-3 mt-2 mb-1 mr-1 hover:bg-white hover:text-[#3dafaa]">
              Add via XLSX
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={uploadEquipmetXLSX}
              />
            </label>
        </div>
      </div>
      <Modal
  isOpen={showFilterModal}
  onRequestClose={() => setShowFilterModal(false)}
  contentLabel="Equipment Filter Modal"
  overlayClassName="overlay"
>
  <div className="modal-content">
    <h2 className="text-2xl font-bold mb-4">Filter Equipment Types</h2>

    {/* Checkboxes for each equipment type */}
    <div className="mb-2">
      {[
        "Capacitor",
        "Resistors",
        "Miscellaneous",
        "Tools",
        "SMD RF Resistors",
        "Connectors/adapters",
        "Trainer Kits",
        "PCB Boards",
        "Microcontroller Boards",
        "Arduino",
        "Sensors",
        "Oscilloscope/Power Supply",
      ].map((type) => (
        <label key={type} className="inline-flex items-center">
          <input
            type="checkbox"
            checked={selectedTypes.includes(type)}
            onChange={() =>
              setSelectedTypes((prev) =>
                prev.includes(type)
                  ? prev.filter((t) => t !== type)
                  : [...prev, type]
              )
            }
            className="form-checkbox h-5 w-5 text-gray-600"
          />
          <span className="ml-2">{type}</span>
        </label>
      ))}
    </div>

    <button
      onClick={() => setShowFilterModal(false)}
      className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
    >
      Apply Filters
    </button>
  </div>
</Modal>

      {loading ? (
        <div className="flex justify-center">
          <ClipLoader
            color={'#3dafaa'}
            loading={loading}
            size={100}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      ) : (
        <>
          
          <div className='overflow-auto max-w-[80vw] max-h-[80vh] ml-2'>
            <table className='w-full border-collapse border'>
              <thead className='sticky top-0'>{renderHeaderRow()}</thead>
              <tbody>
                {addingEquipment && renderAddRow()}
                {equipmentData.map((equipment, index) => renderRow(equipment, index))}
              </tbody>
            </table>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default EquipmentTable;
