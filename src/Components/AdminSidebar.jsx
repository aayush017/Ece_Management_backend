import React from "react";
import { Link } from "react-router-dom";

const SideBar = () => {
  return (
    <div className="bg-[#3dafaa] h-screen text-center w-[19vw] mt-4">
      <div className="flex flex-col">
        <Link
          to="/admin"
          className="bg-[#3dafaa] h-16 p-2 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          DASHBOARD
        </Link>
        <hr className="border-t-2" />
        <Link
          to="/admin/equipment"
          className="bg-[#3dafaa] h-16 p-2 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          EQUIPMENT LIST
        </Link>
        <hr className="border-t-2" />
        <Link
          to="/admin/alloted"
          className="bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          ALLOCATED EQUIPMENTS
        </Link>
        <hr className="border-t-2" />

        <Link
          to="/admin/brequest"
          className="bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          BORROW REQUEST
        </Link>
        <hr className="border-t-2" />
        <Link
          to="/admin/rrequest"
          className="bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          RETURN REQUEST
        </Link>
        <hr className="border-t-2" />
        <Link
          to="/admin/logs"
          className="bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          ISSUE RETURN HISTORY
        </Link>
        <hr className="border-t-2" />
        <Link
          to="/admin/dues_logs"
          className="bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          ALL CLEARED DUES
        </Link>
        <hr className="border-t-2" />
        <Link
          to="/admin/inventory_logs"
          className="bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold"
        >
          INVENTORY UPDATE LOGS
        </Link>
        <hr className="border-t-2" />
      </div>
    </div>
  );
};

export default SideBar;
