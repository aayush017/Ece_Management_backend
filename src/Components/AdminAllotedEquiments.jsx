import { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import {AiOutlineSearch} from "react-icons/ai";
// Import the EquipmentTable component

const AdminBorrowRequest = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lab, setLab] = useState(user.lab);
  const token = localStorage.getItem(user.id);
  const columnNames = [
    "S.No",
    "Equipment Name",
    "Student Email ID",
    "Roll No.",
    "Contact",
    "Quantity",
    "Additional Info",
    "Request Date",
    "Expected return Date",
  ];
  const Host = '';;

  useEffect(() => {
    setLoading(true); fetchRequests();
  }, [lab]);


  const fetchRequests = async () => {
    const status = ["accepted","returning"];
    try {
      const response = await fetch(
        `${Host}api/transaction/requests/${status}/${lab}`,
        {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
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

      setRequests(requestDataArray);
      setLoading(false);
    } catch (error) {
      setLoading(false);

      console.error("Error fetching requests:", error);
    }
  };

  const renderHeader = () => {
    return (
      <tr className="bg-[#3dafaa] text-white">
        {columnNames.map((columnName, index) => (
          <th className="border p-2 text-center" key={index}>
            {columnName}
          </th>
        ))}
      </tr>
    );
  };

  const renderRow = (requestData, index) => {
    const { equipment, student, request } = requestData;
    const formattedReturnedOn = new Date(request.returnedOn).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
    const formattedStartDate = new Date(request.startDate).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
    const formattedreturndate = new Date(request.returnDate).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
    return (
      <tr key={index}>
        <td className="border p-2 text-center">{index + 1}</td>
        <td className="border p-2 text-center">{equipment?.name}</td>
        <td className="border p-2 text-center">{student?.email}</td>
        <td className="border p-2 text-center">{student?.rollNumber}</td>
        <td className="border p-2 text-center">{student?.contactNumber}</td>
        <td className="border p-2 text-center">{request?.quantity}</td>
        <td className="border p-2 text-center">{request?.studentComment}</td>
        <td className="border p-2 text-center">{formattedStartDate}</td>
        <td className="border p-2 text-center">{formattedreturndate}</td>
        <td className="border p-2"></td>
      </tr>
    );
  };

  const filteredRequests = requests.filter((requestData) => {
    const { equipment, student, request } = requestData;
    const searchString = searchTerm.toLowerCase();
  
    return (
      equipment?.name?.toLowerCase().includes(searchString) ||
      student?.email?.toLowerCase().includes(searchString) ||
      student?.rollNumber?.toLowerCase().includes(searchString) ||
      student?.contactNumber?.toLowerCase().includes(searchString) ||
      (request?.startDate && request?.startDate.includes(searchString)) ||
      ((request?.quantity || '').toString().includes(searchString)) ||
      (request?.returnDate && request?.returnDate.includes(searchString))
    );
  });
 
  const handleSearch = (e) => {
    e.preventDefault();
    const inputElement = e.currentTarget.previousSibling;
    const query = inputElement.value;  // Use a local variable
    setSearchTerm(query);
  }

  return (
    <div className="ml-2">
      <div className="flex mt-1">
        <div className="flex items-center mr-2">
          <form className="w-[350px]" onSubmit={(e) => e.preventDefault()}>
            <div className="relative mr-2">
              <input
                type="search"
                placeholder="Search Student..."
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
        <div className="flex items-center">
          <label className="block mb-0 mr-2">Lab:</label>
          <select
            value={lab}
            onChange={(e) => setLab(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="All">All</option>
            <option value="lab1">Lab 1</option>
            <option value="lab2">Lab 2</option>
            <option value="lab3">Lab 3</option>
            <option value="lab4">Lab 4</option>
          </select>
        </div>
      </div>
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
      ):(
      <div className='overflow-auto max-w-[80vw] max-h-[80vh] mt-1'>
        <table className='w-full border-collapse border'>
          <thead className='sticky top-0'>{renderHeader()}</thead>
          <tbody>
            {filteredRequests.map((requestData, index) => renderRow(requestData, index))}
          </tbody>
        </table>
      </div>
      )}
      
    </div>
  );
};

export default AdminBorrowRequest;
