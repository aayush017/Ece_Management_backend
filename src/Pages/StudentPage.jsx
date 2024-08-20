import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminNavbar from '../Components/AdminNavbar.jsx';
import StudentSideBar from '../Components/StudentSideBar.jsx';
import StudentEquipment from '../Components/StudentEquipment.jsx';
import StudentDashBoard from '../Components/StudentDashBoard.jsx';
import StudentRequestStatus from '../Components/StudentRequestStatus.jsx';
import FeedbackForm from '../Components/StudentFeedback.jsx';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../Context/AuthContext.jsx';
const StudentPage = () => {

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
        <div className='fixed w-full'>
        <AdminNavbar user={user} />
        <div className="flex">
          <div className="mr-2">
            <StudentSideBar />
          </div>
          <div className="flex-1">
            <Routes>
              <Route element={<StudentDashBoard user={user} />} path="/" />
              <Route element={<StudentEquipment  user={user} />} path="/equipments" />
              <Route element={<StudentRequestStatus  user={user} />} path="/brequest" />
              <Route element = {<FeedbackForm   user={user} />} path='/feedback'/>
            </Routes>
          </div>
        </div>
      </div>
    );
}

export default StudentPage;