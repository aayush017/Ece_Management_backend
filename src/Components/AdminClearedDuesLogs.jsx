import React, { useEffect, useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import * as XLSX from "xlsx";
import {AiOutlineSearch} from "react-icons/ai";

function AdminClearedDuesLogs({user}) {
    const [loading, setLoading] = useState(true);
    const [tabledata, setTableData] = useState([]);
    const [selectedGraduationYear, setSelectedGraduationYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState("");
    const token= localStorage.getItem(user.id);
    const Host = '';;

    useEffect(() => {
        setLoading(true);
        fetchDuesLogs();
      }, [selectedGraduationYear,searchQuery]);

    const fetchDuesLogs = async () => {
        try {
            const response = await fetch(
              `${Host}api/auth/dueslogs/${selectedGraduationYear}?searchStudent=${searchQuery}`,
              {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                // body: JSON.stringify({ year: selectedGraduationYear }), 
            }
            );
            const res = await response.json();
            setLoading(false);
            if(!res.success){
                alert(res.message);
            }
            else{
                setTableData(res.data);
            }
        } 
        catch (error) {
            console.error("Error clearing dues:", error);
        }
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

    const renderHeader = () => {
        return (
            <tr className="bg-[#3dafaa] text-white">
                <th className="border p-2 text-center">S.No</th>
                <th className="border p-2 text-center">Student Email ID</th>
                <th className="border p-2 text-center">Student Name</th>
                <th className="border p-2 text-center">Roll No.</th>
                <th className="border p-2 text-center">Student Contact No.</th>
                <th className="border p-2 text-center">Dues Cleared By</th>
                <th className="border p-2 text-center">Dues Cleared on</th>
            </tr>
        );
    }

    const renderRow = (data, index) => {
        const formattedDuesClearedDate = new Date(data.student.duesClearedOn).toLocaleDateString(
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
              <td className="border p-2 text-center">{data.student.email}</td>
              <td className="border p-2 text-center">{data.student.fullName}</td>
              <td className="border p-2 text-center">{data.student.rollNumber}</td>
              <td className="border p-2 text-center">{data.student.contactNumber}</td>
              <td className="border p-2 text-center">{data.admin}</td>
              <td className="border p-2 text-center">{formattedDuesClearedDate}</td>
            </tr>
        );
    }

    const handleDownload = () => {
        let data = []
        for (const i of tabledata){
            const formattedDuesClearedDate = new Date(i.student.duesClearedOn).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }
            );
            let row = {}
            row['Student Email ID'] = i['student']['email']
            row['Student Contact Number'] = i['student']['contactNumber']
            row['Cleared By'] = i['admin']
            row['Cleared On'] = formattedDuesClearedDate
            data.push(row)
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Cleared Dues`);
        XLSX.writeFile(
        wb,
        `Cleared_dues.xlsx`
        );
    }

    const handleSearch = (e) => {

        e.preventDefault();
        const inputElement = e.currentTarget.previousSibling;
        const query = inputElement.value;  // Use a local variable
        setSearchQuery(query);
      }

    return (
        <div>
            <div className="flex justify-between my-1 mx-2">  
                <div className="flex items-center">

                    {/* Year Filter */}
                    <label className="block mb-0 mr-1">Cleared Year:</label>
                    {renderFilterOptions(
                        setSelectedGraduationYear,
                        selectedGraduationYear
                    )}

                    {/* Search Button */}
                    <form className="w-[350px] ml-4" onSubmit={(e) => e.preventDefault()}>
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
                <div>
                    <button className="bg-[#3dafaa] text-white px-4 py-2 rounded-full cursor-pointer font-bold"
                        onClick={handleDownload}
                        >
                        Download
                    </button>
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
            ) : (
                <div className="overflow-auto max-w-[80vw] max-h-[80vh] ml-2">
                    <table className="w-full border-collapse border">
                    <thead className="sticky top-0">{renderHeader()}</thead>
                    <tbody>
                    {tabledata.map((data, index) => renderRow(data, index))}
                    </tbody>
                    </table>
                </div>
            )
            
            }
        </div>
    );
}

export default AdminClearedDuesLogs
