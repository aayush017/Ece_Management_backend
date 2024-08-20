import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminNavbar from '../Components/AdminNavbar.jsx';
import EquipmentTable from '../Components/AdminEquipment.jsx';
import AdminAllotedEquiments from '../Components/AdminAllotedEquiments.jsx';
import AdminBorrowRequest from '../Components/AdminBorrowRequest.jsx';
import AdminReturnReqest from '../Components/AdminReturnRequest.jsx';
import SideBar from '../Components/AdminSidebar.jsx';
import AuthContext from '../Context/AuthContext.jsx';
import AdminDashboard from '../Components/AdminDashboard.jsx';
import AdminLogs from '../Components/AdminLogs.jsx';
import AdminClearedDuesLogs from '../Components/AdminClearedDuesLogs.jsx';
import AdminEquipmentLog from '../Components/AdminEquipmentLog.jsx';
import { jwtDecode } from 'jwt-decode';

const AdminPage = () => {
  const { user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the token from localStorage
    let token = localStorage.getItem(user.id);

    // Check if the token exists
    if (token) {
      // Decode the token to get user data
      const decodedToken = jwtDecode(token);

      // Set user data using the login function from the context
      let userData = {
        role: decodedToken['role'],
        id: decodedToken['id'],
        lab: decodedToken['lab'],
        username: decodedToken['username']
      };

      // Log the user in
      login(userData);
    }

    // Set loading to false once user is fetched
    setLoading(false);
  }, []);

  return (
    <div className="fixed w-full">
      <AdminNavbar user={user} />
      <div className="flex">
        <div className="">
          <SideBar />
        </div>
        <div className="flex-1">
          {loading ? (
            // Display a loading spinner or message while user is being fetched
            <div className="text-center p-4">
              <p>Loading...</p>
            </div>
          ) : (
            // Render the Routes once the user is fetched
            <Routes>
              <Route element={<AdminDashboard user={user} />} path="/" />
              <Route element={<EquipmentTable user={user} />} path="/equipment" />
              <Route element={<AdminAllotedEquiments user={user} />} path="/alloted" />
              <Route element={<AdminBorrowRequest user={user} />} path="/brequest" />
              <Route element={<AdminReturnReqest user={user} />} path="/rrequest" />
              <Route element={<AdminLogs user={user} />} path="/logs" />
              <Route element={<AdminClearedDuesLogs user={user} />} path="/dues_logs" />
              <Route element={<AdminEquipmentLog user={user} />} path="/inventory_logs" />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
