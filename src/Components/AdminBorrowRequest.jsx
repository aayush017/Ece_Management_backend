import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import ClipLoader from "react-spinners/ClipLoader";

const AdminBorrowRequest = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem(user.id);
  const columnNames = [
    "S.No",
    "Equipment Name",
    "Student Email ID",
    "Contact",
    "Request Date",
    "Quantity",
    "Return Date",
    "Aditional Info",
    "Action",
  ];
  const Host = '';;

  useEffect(() => {
    setLoading(true); fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const status = "requested";
    try {
      const response = await fetch(
        `${Host}api/transaction/requests/${status}/${user.lab}`,
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

  const acceptAlert = (requestID) => {
    Swal.fire({
      title: "Accept the request?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Accept",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        acceptRequest(requestID);
      }
    });
  };

  const acceptRequest = async (requestID) => {
    try {
      const response = await fetch(
        `${Host}api/transaction/accept/${requestID}`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error);
        throw new Error(errorData.error);
      }

      fetchRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const declineRequest = async (requestID) => {
    try {
      const response = await fetch(
        `${Host}api/transaction/decline/${requestID}`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error);
        throw new Error(errorData.error);
      }

      fetchRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const declineAlert = (requestID) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this decline!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Decline The Request",
    }).then((result) => {
      if (result.isConfirmed) {
        setLoading(true);
        declineRequest(requestID);
      }
    });
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
    const formattedreturndate = new Date(request.returnDate).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
    const formattedstartDate = new Date(request.startDate).toLocaleDateString(
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
        <td className="border p-2 text-center">{formattedstartDate}</td>
        <td className="border p-2 text-center">{request?.quantity}</td>
        <td className="border p-2 text-center">{formattedreturndate}</td>
        <td className="border p-2 text-center">{request?.studentComment}</td>
        <td className="border p-2">
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-2 py-1 rounded-md items-center"
              onClick={() => acceptAlert(request._id)}
            >
              Accept
            </button>

            <button
              className="bg-red-500 text-white px-2 py-1 rounded-md items-center"
              onClick={() => declineAlert(request._id)}
            >
              Decline
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <>
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
      <div className='overflow-auto max-w-[80vw] max-h-[83vh] mt-4 ml-2'>
        <table className='w-full border-collapse border'>
          <thead className='sticky top-0'>{renderHeader()}</thead>
          <tbody>
            {requests.map((requestData, index) => renderRow(requestData, index))}
          </tbody>
        </table>
      </div>
    )}
    </>
  );
};

export default AdminBorrowRequest;
