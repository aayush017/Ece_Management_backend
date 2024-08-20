import React, { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import * as XLSX from "xlsx";
import {AiOutlineSearch} from "react-icons/ai";

function AdminLogs({ user }) {

  const [requests, setRequests] = useState([]);  
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear()); // this year is to filter render data , by default it is set to current year
  const [searchedEmail, setSearchedEmail] = useState('')
  const token = localStorage.getItem(user.id);
  const columnNames = [
    "S.No",
    "Equipment Name",
    "Student Email ID",
    "Contact",
    "Quantity",
    "Additional Info",
    "Issued On",
    "Due Date",
    "Retuned On",
    "Remark",
  ];
  const Host = '';;

  useEffect(() => {
    setLoading(true); fetchRequests();
  },[year, searchedEmail]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        `${Host}api/transaction/requests/completed/${user.lab}?year=${year}&studentEmail=${searchedEmail}`,
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
        <td className="border p-2 text-center">{student?.contactNumber}</td>
        <td className="border p-2 text-center">{request?.quantity}</td>
        <td className="border p-2 text-center">{request?.studentComment}</td>
        <td className="border p-2 text-center">{formattedStartDate}</td>
        <td className="border p-2 text-center">{formattedreturndate}</td>
        <td className="border p-2 text-center">{formattedReturnedOn}</td>              
        <td className="border p-2 text-center">{request?.adminComments}</td>
        </tr>
    );
  };
  
  const handleDownload = () => {

    let currentDate = new Date();

    // Get current date components
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1; // Month is zero-based, so we add 1
    let day = currentDate.getDate();
    
    let data = []
    for (const i of requests){
      let row = {}
      row['Equipment Name'] = i['equipment']['name']
      row['Student Email ID'] = i['student']['email']
      row['Conatact'] = i['student']['contactNumber']
      row['Conatact'] = i['student']['contactNumber']
      row['Quantity'] = i['request']['quantity']
      row['Additional Info'] = i['student']['studentComment']
      row['Request On'] = i['request']['startDate']
      row['Due Date'] = i['request']['returnDate']
      row['Returned On'] = i['request']['returnedOn']
      row['Remark'] = i['request']['adminComments']
      data.push(row)
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${user.lab}`);
    XLSX.writeFile(
      wb,
      `${user.lab}_${day}/${month}/${year}.xlsx`
    );
  }

  const renderFilterOptions = (setSelectedOption, selectedOption) => (
    <select
      value={selectedOption}
      onChange={(e) => {setSelectedOption(e.target.value); setSearchedEmail('');}}
      className="p-2 border rounded"
    >
      <option value="All">All</option>
      <option value={new Date().getFullYear()}>
        {new Date().getFullYear()}
      </option>
    </select>
    
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const inputElement = e.currentTarget.previousSibling;
    const query = inputElement.value;  // Use a local variable
    setSearchedEmail(query);
  }

  return (
    <div className="">
      <div className="flex justify-between my-1 mx-2"> 
        <div className='flex items-center'>
          <label className="block mb-0 mr-1">Year:</label>
          {renderFilterOptions(
            setYear,
            year
          )}

          <form className="w-[350px] ml-4" onSubmit={(e) => e.preventDefault()}>
            <div className="relative mr-2">
              <input
                type="search"
                placeholder="Search Students by email..."
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
        <button className="bg-[#3dafaa] text-white px-4 py-2 rounded-full cursor-pointer font-bold"
        onClick={handleDownload}
        >
          Download
        </button>
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
        <div className='overflow-auto max-w-[80vw] max-h-[80vh] ml-2'>
          <table className='w-full border-collapse border'>
            <thead className='sticky top-0'>{renderHeader()}</thead>
            <tbody>
              {requests.map((requestData, index) => renderRow(requestData, index))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminLogs;
