import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import * as ExcelJS from "exceljs";
import { employeeService, salaryService } from "../api/api";

const Salary = () => {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Multiple employee selection for batch calculation
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // Common form state for all selected employees
  const [calculationForm, setCalculationForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    workingDays: 21,
    daysOff: 0,
    overtime: 0,
    bonus: 0,
    isProbation: false,
  });

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to fetch employees. Please try again.");
    }
  };

  // Fetch salaries with filter for current month/year
  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const data = await salaryService.getByPeriod(currentMonth, currentYear);
      setSalaries(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching salaries:", error);
      setError("Failed to fetch salaries. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  useEffect(() => {
    fetchSalaries();
  }, [token, currentMonth, currentYear]);

  // Toggle employee selection for batch calculation
  const toggleEmployeeSelection = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  // Check if an employee already has a salary calculation for the selected month
  const hasExistingSalary = (employeeId) => {
    return salaries.some(
      (salary) =>
        salary.employeeId === employeeId &&
        salary.month === calculationForm.month &&
        salary.year === calculationForm.year
    );
  };

  // Open the calculation modal
  const openCalculationModal = () => {
    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    // Check if any of the selected employees already have salary calculations
    const employeesWithExistingSalaries = selectedEmployees
      .filter((empId) => hasExistingSalary(empId))
      .map((empId) => {
        const emp = employees.find((e) => e.id === empId);
        return emp ? emp.name : `Employee ID ${empId}`;
      });

    if (employeesWithExistingSalaries.length > 0) {
      setError(
        `The following employees already have salary calculations for ${
          calculationForm.month
        }/${calculationForm.year}: ${employeesWithExistingSalaries.join(", ")}`
      );
      return;
    }

    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCalculationForm({
      ...calculationForm,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value) || 0
          : value,
    });
  };

  // Calculate salaries for all selected employees
  const calculateSalaries = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the batch processing endpoint
      const calculationData = {
        employeeIds: selectedEmployees,
        month: calculationForm.month,
        year: calculationForm.year,
        workingDays: calculationForm.workingDays,
        daysOff: calculationForm.daysOff,
        overtime: calculationForm.overtime,
        bonus: calculationForm.bonus,
      };

      const response = await salaryService.calculate(calculationData);

      // Check for success or errors
      if (response.success) {
        // Refresh the salary list
        const updatedSalaries = await salaryService.getByPeriod(
          currentMonth,
          currentYear
        );

        setSalaries(updatedSalaries);

        // Reset form and close modal
        setSelectedEmployees([]);
        setShowModal(false);
        setSuccessMessage(
          `Successfully calculated salaries for ${response.results.length} employees`
        );

        // Show any errors that occurred during batch processing
        if (response.errors && response.errors.length > 0) {
          const errorMessage = response.errors
            .map((err) => `Employee ID ${err.employeeId}: ${err.message}`)
            .join("; ");
          setError(`Some calculations had errors: ${errorMessage}`);
        }
      } else {
        setError(response.message || "Failed to calculate salaries");
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error calculating salaries:", error);
      setError(
        error.response?.data?.message ||
          "Failed to calculate salaries. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a salary record
  const deleteSalary = async (id) => {
    if (
      !window.confirm("Are you sure you want to delete this salary record?")
    ) {
      return;
    }

    try {
      await salaryService.delete(id);
      setSalaries(salaries.filter((salary) => salary.id !== id));
      setSuccessMessage("Salary record deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting salary:", error);
      setError("Failed to delete salary record. Please try again.");
    }
  };

  // Export salaries to Excel
  const exportToExcel = async () => {
    if (salaries.length === 0) {
      setError("No salary data to export");
      return;
    }

    try {
      await salaryService.exportToExcel(currentMonth, currentYear);
      setSuccessMessage("Salary data exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export data. Please try again.");
    }
  };

  // Generate month options
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

  // Generate year options (current year and 5 years back)
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => thisYear - 3 + i);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Salary Management</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-40">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Month
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-36">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Year
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Export Current Month
            </button>
            <button
              onClick={openCalculationModal}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Calculate Salary
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button className="float-right" onClick={() => setError(null)}>
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
            <button
              className="float-right"
              onClick={() => setSuccessMessage("")}
            >
              &times;
            </button>
          </div>
        )}

        {/* Employee Selection Table */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Select Employees for Salary Calculation
          </h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={() => {
                        if (selectedEmployees.length === employees.length) {
                          setSelectedEmployees([]);
                        } else {
                          setSelectedEmployees(employees.map((emp) => emp.id));
                        }
                      }}
                      checked={
                        selectedEmployees.length === employees.length &&
                        employees.length > 0
                      }
                    />
                  </th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Base Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className={
                      hasExistingSalary(employee.id) ? "bg-gray-100" : ""
                    }
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => toggleEmployeeSelection(employee.id)}
                        disabled={hasExistingSalary(employee.id)}
                      />
                    </td>
                    <td>{employee.fullname}</td>
                    <td>{employee.position || "N/A"}</td>
                    <td>{employee.department || "N/A"}</td>
                    <td>{employee.salary?.toLocaleString() || 0}</td>
                    <td>
                      {employee.probation === "yes" ? "Probation" : "Regular"}
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Salaries Table */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">
            Salary Records for{" "}
            {months.find((m) => m.value === currentMonth)?.label} {currentYear}
          </h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Month/Year</th>
                  <th>Working Days</th>
                  <th>Gross Salary</th>
                  <th>Tax</th>
                  <th>Net Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="spinner"></div> Loading...
                    </td>
                  </tr>
                ) : salaries.length > 0 ? (
                  salaries.map((salary) => (
                    <tr key={salary.id}>
                      <td>{salary.id}</td>
                      <td>{salary.fullname}</td>
                      <td>
                        {months
                          .find((m) => m.value === salary.month)
                          ?.label.substring(0, 3)}{" "}
                        {salary.year}
                      </td>
                      <td>{salary.workDays || 0}</td>
                      <td>{(salary.grossSalary || 0).toLocaleString()}</td>
                      <td>{(salary.totalTax || 0).toLocaleString()}</td>
                      <td>{(salary.netSalary || 0).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => deleteSalary(salary.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      No salary records found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Modal */}
        {showModal && (
          <div className="modal">
            <div
              className="modal-overlay"
              onClick={() => setShowModal(false)}
            ></div>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-xl font-semibold">
                  Calculate Salary for {selectedEmployees.length} Employee
                  {selectedEmployees.length !== 1 ? "s" : ""}
                </h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select
                      name="month"
                      className="input"
                      value={calculationForm.month}
                      onChange={handleInputChange}
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select
                      name="year"
                      className="input"
                      value={calculationForm.year}
                      onChange={handleInputChange}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Working Days</label>
                    <input
                      type="number"
                      name="workingDays"
                      className="input"
                      value={calculationForm.workingDays}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Days Off</label>
                    <input
                      type="number"
                      name="daysOff"
                      className="input"
                      value={calculationForm.daysOff}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Overtime Hours</label>
                    <input
                      type="number"
                      name="overtime"
                      className="input"
                      value={calculationForm.overtime}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bonus</label>
                    <input
                      type="number"
                      name="bonus"
                      className="input"
                      value={calculationForm.bonus}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isProbation"
                      className="mr-2"
                      checked={calculationForm.isProbation}
                      onChange={handleInputChange}
                    />
                    Employee(s) on probation (85% of full salary)
                  </label>
                </div>

                <div className="form-group mt-4">
                  <p className="text-gray-700 text-sm">
                    Note: Fixed allowances (food, clothes, parking, fuel, house
                    rent, phone) will be automatically applied from each
                    employee's profile.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary mr-2"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={calculateSalaries}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner mr-2"></div> Calculating...
                    </>
                  ) : (
                    "Calculate Salaries"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Salary;
