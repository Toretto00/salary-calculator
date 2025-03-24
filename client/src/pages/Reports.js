import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { salaryService, formatVND } from "../api/api";
import { useAuth } from "../contexts/AuthContext";

const Reports = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlySummary, setMonthlySummary] = useState(null);
  const { isLoading } = useAuth();

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - 3 + i
  );

  useEffect(() => {
    fetchSalaries();
  }, [selectedMonth, selectedYear]);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const data = await salaryService.getByPeriod(selectedMonth, selectedYear);
      setSalaries(data);

      // Calculate monthly summary
      calculateMonthlySummary(data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching salary data:", error);
      setError("Failed to fetch salary data");
      setLoading(false);
    }
  };

  const calculateMonthlySummary = (data) => {
    if (!data || data.length === 0) {
      setMonthlySummary(null);
      return;
    }

    const summary = {
      totalEmployees: data.length,
      totalGrossSalary: data.reduce((sum, item) => sum + item.grossSalary, 0),
      totalNetSalary: data.reduce((sum, item) => sum + item.netSalary, 0),
      totalTax: data.reduce((sum, item) => sum + item.totalTax, 0),
      totalInsurance: data.reduce((sum, item) => sum + item.totalInsurance, 0),
      totalBenefits: data.reduce((sum, item) => sum + item.totalBenefits, 0),
      totalOvertime: data.reduce((sum, item) => sum + item.totalOvertime, 0),
    };

    setMonthlySummary(summary);
  };

  const handleExportExcel = async () => {
    try {
      await salaryService.exportToExcel(selectedMonth, selectedYear);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export data to Excel");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Salary Reports</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
          <div className="w-full md:w-1/4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Month
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Year
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-1/4 flex items-end">
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              onClick={handleExportExcel}
            >
              Export to Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <>
            {monthlySummary ? (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-xl font-bold mb-4">
                  Monthly Summary -{" "}
                  {months.find((m) => m.value === selectedMonth)?.label}{" "}
                  {selectedYear}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-gray-700">
                      Total Employees
                    </h3>
                    <p className="text-2xl font-bold">
                      {monthlySummary.totalEmployees}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-gray-700">
                      Total Gross Salary
                    </h3>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(monthlySummary.totalGrossSalary)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-gray-700">
                      Total Net Salary
                    </h3>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(monthlySummary.totalNetSalary)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-gray-700">Total Tax</h3>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(monthlySummary.totalTax)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-gray-700">
                      Total Insurance
                    </h3>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(monthlySummary.totalInsurance)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded shadow">
                    <h3 className="font-semibold text-gray-700">
                      Total Benefits
                    </h3>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(monthlySummary.totalBenefits)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No salary data available for{" "}
                {months.find((m) => m.value === selectedMonth)?.label}{" "}
                {selectedYear}
              </div>
            )}

            <h2 className="text-xl font-bold mb-4">Salary Details</h2>
            {salaries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Employee</th>
                      <th className="border p-2 text-right">Gross Salary</th>
                      <th className="border p-2 text-right">Net Salary</th>
                      <th className="border p-2 text-right">Tax</th>
                      <th className="border p-2 text-right">Insurance</th>
                      <th className="border p-2 text-right">Benefits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map((salary) => (
                      <tr key={salary.id} className="hover:bg-gray-50">
                        <td className="border p-2">{salary.fullname}</td>
                        <td className="border p-2 text-right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(salary.grossSalary)}
                        </td>
                        <td className="border p-2 text-right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(salary.netSalary)}
                        </td>
                        <td className="border p-2 text-right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(salary.totalTax)}
                        </td>
                        <td className="border p-2 text-right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(salary.totalInsurance)}
                        </td>
                        <td className="border p-2 text-right">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(salary.totalBenefits)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No salary records found
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
