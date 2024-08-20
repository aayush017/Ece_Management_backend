import React, { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import Modal from 'react-modal';
import {AiOutlineSearch} from "react-icons/ai";

const AdminDashboard = ({user}) => {
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedGraduationYear, setSelectedGraduationYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [studentIdToDelete, setStudentIdToDelete] = useState("");
  const [studentEmailToDelete, setStudentEmailToDelete] = useState("");
  const [studentEquipedData,setStudentEquipedData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const token= localStorage.getItem(user.id);
  const Host = '';;

  useEffect(() => {
    // On reloading the user at ProtectedRoute.jsx pages gets re-initilized and become null as default value
    // due to which ProtectedRoute.jsx page was unable to locate token because token for each user is mapped by using its user id and in case of relaod user is null at ProtectedRoute.jax page
    // therefore this useEffect will store the user id of user who have relaoded the page, using this ProtectedRoute.jsx page will able to locate token
    const handleBeforeUnload = () => {
      localStorage.setItem("Reloaded_User",user.id);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStudents();
  }, [selectedGraduationYear,searchQuery]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${Host}api/auth/students/${selectedGraduationYear}?searchStudent=${searchQuery}`,
      {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    }
      );
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
      } else {
        console.error("Error fetching students:", data.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching students:", error);
    }
  };

  const disableStudent = async (studentId, studentEmail) => {
    setStudentIdToDelete(studentId);
    setStudentEmailToDelete(studentEmail);
    fetchStudentEqipedItems(studentId);
    setShowModal(true);
  };

  const fetchStudentEqipedItems = async (studentID) => {
    const statuses = ["accepted", "returning"]; // Use an array for multiple statuses
    const lab = 'All';
    setModalLoading(true);
    try {

      const response = await fetch(
        `${Host}api/transaction/requests/${statuses}/${lab}/${studentID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      const requestsArray = data.Rrequests || [];
      const studentsArray = data.students || [];
      const equipmentsArray = data.equipments || [];

      const requestDataArray = requestsArray.map((request, index) => {
        return {
          request: requestsArray[index] || {},
          student: studentsArray[index] || {},
          equipment: equipmentsArray[index] || {},
        };
      });

      setStudentEquipedData(requestDataArray);
      setModalLoading(false);
    }
    catch (error){
      setModalLoading(false);
      alert("Error in fetching student details");
    }
  }

  const closeModal = () => {
    setShowModal(false);
  };

  const handleClearDues = async () => {
    try {
      const response = await fetch(`${Host}api/auth/disableStudent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ studentID: studentIdToDelete })
      });

      if (response.ok) {
        fetchStudents();
        setShowModal(false);
      } else {
        console.error("Failed to clear dues.");
      }
    } catch (error) {
      console.error("Error clearing dues:", error);
    }
  };

  const renderHeader = () => {
    return (
      <tr className="bg-[#3dafaa] text-white">
        <th className="border p-2 text-center">S.No</th>
        <th className="border p-2 text-center">Full Name</th>
        <th className="border p-2 text-center">Email</th>
        <th className="border p-2 text-center">Roll Number</th>
        <th className="border p-2 text-center">Enrollment Date</th>
        <th className="border p-2 text-center">Contact Number</th>
        <th className="border p-2 text-center">Branch</th>
        <th className="border p-2 text-center">Program</th>
        <th className="border p-2 text-center">Graduation Year</th>
        <th className="border p-2 text-center">Action</th>
      </tr>
    );
  };

  const renderRow = (student, index) => {
    const isBatchSelected =
      selectedBatch === "" || student.graduationType === selectedBatch;

    const isBranchSelected =
      selectedBranch === "" || student.branch === selectedBranch;

    if (isBatchSelected && isBranchSelected) {
      return (
        <tr key={index}>
          <td className="border p-2 text-center">{index + 1}</td>
          <td className="border p-2 text-center">{student.fullName}</td>
          <td className="border p-2 text-center">{student.email}</td>
          <td className="border p-2 text-center">{student.rollNumber}</td>
          <td className="border p-2 text-center">
            {new Date(student.enrollmentDate).toLocaleDateString()}
          </td>
          <td className="border p-2 text-center">{student.contactNumber}</td>
          <td className="border p-2 text-center">{student.branch}</td>
          <td className="border p-2 text-center">{student.graduationType}</td>
          <td className="border p-2 text-center">{student.graduationYear}</td>
          <td className="border p-2 text-center">
            <button
              className="bg-red-500 text-white px-2 py-1 rounded-md items-center"
              onClick={() => disableStudent(student._id, student.email)}
            >
              Clear Dues
            </button>
          </td>
        </tr>
      );
    }
    return null;
  };

  const renderFilterOptions = (setSelectedOption, selectedOption) => (
    <select
      value={selectedOption}
      onChange={(e) => {setSelectedOption(e.target.value); setSearchQuery('');}}
      className="p-2 border rounded"
    >
      <option value="All">All</option>
      <option value={new Date().getFullYear()}>
        {new Date().getFullYear()}
      </option>
    </select>
    
  );

  const renderEquipmentDetails = (requestData, index) => {
    const { equipment, request } = requestData;
    
    return (
      <tr key={index}>
        <td className="border p-2 text-center bg-gray-200">{index + 1}</td>
        <td className="border p-2 text-center bg-gray-200">{equipment?.name}</td>
        <td className="border p-2 text-center bg-gray-200">{request?.lab}</td>
        <td className="border p-2 text-center bg-gray-200">{request?.quantity}</td>
      </tr>
    );
  };

  const handleSearch = (e) => {

    e.preventDefault();
    const inputElement = e.currentTarget.previousSibling;
    const query = inputElement.value;  // Use a local variable
    setSearchQuery(query);
  }

  return (
    <>
      <Modal
        isOpen={showModal}
        onRequestClose={closeModal}
        contentLabel="Confirm Clear Dues"
      >
        {modalLoading ? (
          <div className="flex justify-center items-center h-full">
            <ClipLoader
              color={'#3dafaa'}
              loading={modalLoading}
              size={100}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) : (
          <div className="flex flex-col justify-evenly h-full">

            <div>
              {
                studentEquipedData.length !== 0 ?
                <div className="flex flex-col items-center w-full mb-5">
                  <h2 className= 'text-gray-500 text-5xl mb-10'>Student has following Items equiped</h2>
                  <div className="w-full max-h-[40vh] overflow-auto">
                    <table className="w-full max-h-[40vh] overflow-auto">
                      <thead className="sticky top-0">
                        <tr className="bg-gray-400">
                          <th className="border p-2 text-center">S.No.</th>
                          <th className="border p-2 text-center">Equipment Name</th>
                          <th className="border p-2 text-center">Lab</th>
                          <th className="border p-2 text-center">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                      {studentEquipedData.map((data, index) => renderEquipmentDetails(data, index))}
                      </tbody>
                    </table>
                  </div>
                </div>
                : 
                <div className="flex flex-col items-center w-full">
                  <h2 className= 'text-gray-500 text-5xl mt-10'>Student has no Item equiped</h2>
                </div>
              }
            </div>
            <div className={`flex flex-col items-center ${studentEquipedData.length === 0 ? `justify-center h-full`: `justify-end`} `}>  
              <h2 className={`${studentEquipedData.length === 0 ? `text-5xl mb-4`:'text-3xl'}`}>Are you sure?</h2>
              <p className={`${studentEquipedData.length === 0 ? `text-2xl mb-3`:'text-2xl mb-1'}`}>{`You want to clear dues of ${studentEmailToDelete} ?`}</p>
              <div>
                <button 
                  onClick={handleClearDues}
                  className="mr-2 p-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
                >
                  Clear Dues
                </button>
                <button 
                  onClick={closeModal}
                  className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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
        <div className="ml-2 mt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                <label className="block mb-0 mr-2">Graduation Year:</label>
                {renderFilterOptions(
                  setSelectedGraduationYear,
                  selectedGraduationYear
                )}
              </div>
            </div>
            <form className="w-[350px]" onSubmit={(e) => e.preventDefault()}>
              <div className="relative mr-2">
                <input
                  type="search"
                  placeholder="Search Students..."
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
          <div className="overflow-auto max-w-[80vw] max-h-[80vh]">
            <table className="w-full border-collapse border">
              <thead className="sticky top-0">{renderHeader()}</thead>
              <tbody>
                {students.map((student, index) => renderRow(student, index))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
