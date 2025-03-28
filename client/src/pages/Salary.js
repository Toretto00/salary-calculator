import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { salaryService, employeeService } from "../api/api";
import { formatCurrency } from "../utils/format";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "../utils/toast";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

// Custom tag component
const Tag = ({ severity, value, className = "" }) => {
  const colorMap = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`${
        colorMap[severity] || colorMap.info
      } text-xs px-2 py-1 rounded ${className}`}
    >
      {value}
    </span>
  );
};

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
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [calculationForm, setCalculationForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    daysOff: 0,
    overtimesoon: 0,
    overtimelate: 0,
    bonus: 0,
    isProbation: false,
  });
  const [calculatedWorkingDays, setCalculatedWorkingDays] = useState(null);
  const [employeesWithSalaries, setEmployeesWithSalaries] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Update calculation form when current month/year changes
  useEffect(() => {
    setCalculationForm((prev) => ({
      ...prev,
      month: currentMonth,
      year: currentYear,
    }));
  }, [currentMonth, currentYear]);

  // Calculate working days for selected month/year
  const calculateWorkingDays = (month, year) => {
    // Create date for the first day of the month
    const startDate = new Date(year, month - 1, 1);
    // Create date for the last day of month
    const endDate = new Date(year, month, 0);

    let workingDays = 0;

    // Loop through all days in the month
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Check if the day is a weekday (1-5 = Monday to Friday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  };

  // Update working days display when month/year changes in the form
  useEffect(() => {
    if (calculationForm.month && calculationForm.year) {
      const workingDays = calculateWorkingDays(
        parseInt(calculationForm.month),
        parseInt(calculationForm.year)
      );
      setCalculatedWorkingDays(workingDays);
    }
  }, [calculationForm.month, calculationForm.year]);

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

  // Fetch employees with existing salaries
  useEffect(() => {
    const checkExistingSalaries = async () => {
      if (employees.length === 0) return;

      const withSalaries = [];
      for (const emp of employees) {
        try {
          // Check against the current filter period
          const hasSalary = await hasExistingSalary(
            emp.id,
            currentMonth,
            currentYear
          );
          if (hasSalary) {
            withSalaries.push(emp.id);
          }
        } catch (error) {
          console.error("Error checking salary:", error);
        }
      }
      setEmployeesWithSalaries(withSalaries);
    };

    checkExistingSalaries();
  }, [employees, currentMonth, currentYear]);

  // Toggle employee selection for batch calculation
  const toggleEmployeeSelection = (employeeId) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  // Check if an employee already has a salary calculation for the selected month
  const hasExistingSalary = async (employeeId, month, year) => {
    try {
      // Get the specific month/year data we're trying to calculate for
      const data = await salaryService.getByPeriod(
        parseInt(month),
        parseInt(year)
      );

      return data.some((salary) => salary.employeeId === employeeId);
    } catch (error) {
      console.error("Error checking existing salary:", error);
      return false; // Assume no existing record if check fails
    }
  };

  // Open the calculation modal
  const openCalculationModal = async () => {
    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    // Update the form with current filter values
    const updatedForm = {
      ...calculationForm,
      month: currentMonth,
      year: currentYear,
    };
    setCalculationForm(updatedForm);

    setLoading(true);

    // Check if any of the selected employees already have salary calculations
    const employeesWithExistingSalaries = [];

    for (const empId of selectedEmployees) {
      if (await hasExistingSalary(empId, updatedForm.month, updatedForm.year)) {
        const emp = employees.find((e) => e.id === empId);
        employeesWithExistingSalaries.push(
          emp ? emp.fullname : `Employee ID ${empId}`
        );
      }
    }

    setLoading(false);

    if (employeesWithExistingSalaries.length > 0) {
      // Ask for confirmation to overwrite using AlertDialog
      setConfirmDialogProps({
        title: "Confirm Overwrite",
        message: `The following employees already have salary calculations for ${
          months.find((m) => m.value === updatedForm.month)?.label
        } ${updatedForm.year}:\n\n${employeesWithExistingSalaries.join(
          "\n"
        )}\n\nDo you want to overwrite them?`,
        onConfirm: () => {
          setShowModal(true);
          toast.info(
            "Attendance data will be used to determine working days and days off automatically (≥7 hours = full day, 4-7 hours = half day)"
          );
        },
      });
      setShowConfirmDialog(true);
    } else {
      // No existing salaries, show calculation modal directly
      setShowModal(true);
      toast.info(
        "Attendance data will be used to determine working days and days off automatically (≥7 hours = full day, 4-7 hours = half day)"
      );
    }
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
        overtimesoon: calculationForm.overtimesoon,
        overtimelate: calculationForm.overtimelate,
        bonus: calculationForm.bonus,
      };

      const response = await salaryService.calculate(calculationData);

      console.log("Salary calculation response:", response);

      // Check if response has expected properties
      if (response && Array.isArray(response)) {
        // Get the first result as a reference
        const firstResult = response[0];

        // Check for attendance summary
        if (firstResult && firstResult.attendanceSummary) {
          console.log(
            "Attendance summary found:",
            firstResult.attendanceSummary
          );

          // Set days off based on absences from attendance
          const daysOff = firstResult.attendanceSummary.absences || 0;
          console.log("Setting days off to:", daysOff);

          setCalculationForm((prev) => ({
            ...prev,
            daysOff: daysOff,
          }));

          // Also set working days if available
          if (firstResult.attendanceSummary.totalWorkingDays) {
            setCalculatedWorkingDays(
              firstResult.attendanceSummary.totalWorkingDays
            );
          }
        } else {
          console.log("No attendance summary found in response");
        }

        // Check for success
        await fetchSalaries();

        // Reset form and close modal
        setSelectedEmployees([]);
        setShowModal(false);
        setSuccessMessage(
          `Successfully calculated salaries for ${
            response.length
          } employees for ${
            months.find((m) => m.value === parseInt(calculationForm.month))
              ?.label
          } ${calculationForm.year}`
        );
      } else if (response.success) {
        // Refresh both the calculation month data and the currently displayed month data
        if (
          calculationForm.month === currentMonth &&
          calculationForm.year === currentYear
        ) {
          // If we calculated for the current displayed period, just refresh that
          await fetchSalaries();
        } else {
          // Otherwise, refresh the current display but also check if we need to update our disabled rows
          await fetchSalaries();

          // Re-check which employees have salaries for the period we just calculated for
          const updatedWithSalaries = [...employeesWithSalaries];
          for (const result of response.results || []) {
            if (
              result.employeeId &&
              !updatedWithSalaries.includes(result.employeeId)
            ) {
              updatedWithSalaries.push(result.employeeId);
            }
          }
          setEmployeesWithSalaries(updatedWithSalaries);
        }

        // Reset form and close modal
        setSelectedEmployees([]);
        setShowModal(false);
        setSuccessMessage(
          `Successfully calculated salaries for ${
            response.results?.length || 0
          } employees for ${
            months.find((m) => m.value === parseInt(calculationForm.month))
              ?.label
          } ${calculationForm.year}`
        );

        // Show any errors that occurred during batch processing
        if (response.errors && response.errors.length > 0) {
          const errorMessage = response.errors
            .map(
              (err) =>
                `${
                  employees.find((e) => e.id === err.employeeId)?.fullname ||
                  `Employee ID ${err.employeeId}`
                }: ${err.message}`
            )
            .join("; ");
          setError(`Some calculations had errors: ${errorMessage}`);
        }
      } else {
        setError(response.message || "Failed to calculate salaries");
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
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

  // Add new function to handle payslip export
  const handleExportPayslip = async (salary) => {
    try {
      setLoading(true);
      const response = await salaryService.exportPayslip(salary.id);

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip_${salary.employeeId}_${salary.month}_${salary.year}.pdf`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      setSuccessMessage("Payslip exported successfully!");
    } catch (error) {
      console.error("Error exporting payslip:", error);
      setError("Failed to export payslip. Please try again.");
    } finally {
      setLoading(false);
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

  const handleDeleteEmployee = async (employeeId) => {
    try {
      await employeeService.deleteEmployee(employeeId);
      setSuccessMessage("Employee deleted successfully!");
      // Refresh the employees list
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Salary Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Salary Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="w-full md:w-40">
                <Label htmlFor="month-select" className="mb-2">
                  Month
                </Label>
                <Select
                  id="month-select"
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                >
                  {months.map((month) => (
                    <SelectOption key={month.value} value={month.value}>
                      {month.label}
                    </SelectOption>
                  ))}
                </Select>
              </div>
              <div className="w-full md:w-36">
                <Label htmlFor="year-select" className="mb-2">
                  Year
                </Label>
                <Select
                  id="year-select"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                >
                  {years.map((year) => (
                    <SelectOption key={year} value={year}>
                      {year}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Export Current Month
              </Button>
              <Button onClick={openCalculationModal}>Calculate Salary</Button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
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
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Select Employees for Salary Calculation
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              <span className="inline-block w-3 h-3 bg-muted mr-1"></span>
              Shaded rows indicate employees that already have salary
              calculations for{" "}
              {months.find((m) => m.value === currentMonth)?.label}{" "}
              {currentYear}
            </p>
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedEmployees.length === employees.length &&
                          employees.length > 0
                        }
                        onChange={() => {
                          if (selectedEmployees.length === employees.length) {
                            setSelectedEmployees([]);
                          } else {
                            setSelectedEmployees(
                              employees.map((emp) => emp.id)
                            );
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow
                      key={employee.id}
                      className={
                        employeesWithSalaries.includes(employee.id)
                          ? "bg-muted"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          disabled={employeesWithSalaries.includes(employee.id)}
                        />
                      </TableCell>
                      <TableCell>{employee.fullname}</TableCell>
                      <TableCell>{employee.position || "N/A"}</TableCell>
                      <TableCell>{employee.department || "N/A"}</TableCell>
                      <TableCell>
                        {employee.salary?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        {employee.probation === "yes" ? "Probation" : "Regular"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan="6" className="text-center py-4">
                        No employees found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Salaries Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Salary Records for{" "}
              {months.find((m) => m.value === currentMonth)?.label}{" "}
              {currentYear}
            </h2>
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Total Benefits</TableHead>
                    <TableHead>Working Days</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Taxable Income</TableHead>
                    <TableHead>Social Insurance</TableHead>
                    <TableHead>Health Insurance</TableHead>
                    <TableHead>Unemployment Insurance</TableHead>
                    <TableHead>Total Tax</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>{salary.fullname}</TableCell>
                      <TableCell>
                        {formatCurrency(salary.grossSalary)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.totalBenefits)}
                      </TableCell>
                      <TableCell>{salary.workDays}</TableCell>
                      <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                      <TableCell>
                        {formatCurrency(salary.taxableIncome)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.socialInsurance)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.healthInsurance)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.accidentInsurance)}
                      </TableCell>
                      <TableCell>{formatCurrency(salary.totalTax)}</TableCell>
                      <TableCell>{formatCurrency(salary.netSalary)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportPayslip(salary)}
                            disabled={loading}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSalary(salary.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>
                Calculate Salary for {selectedEmployees.length} Employee
                {selectedEmployees.length !== 1 ? "s" : ""}(
                {
                  months.find(
                    (m) => m.value === parseInt(calculationForm.month)
                  )?.label
                }{" "}
                {calculationForm.year})
              </CardTitle>
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calc-month" className="mb-2">
                    Month
                  </Label>
                  <Select
                    id="calc-month"
                    name="month"
                    value={calculationForm.month}
                    onChange={handleInputChange}
                    className="w-full"
                  >
                    {months.map((month) => (
                      <SelectOption key={month.value} value={month.value}>
                        {month.label}
                      </SelectOption>
                    ))}
                  </Select>
                  <p className="text-sm text-blue-600 mt-1">
                    You can calculate for any month, not just the current filter
                  </p>
                </div>

                <div>
                  <Label htmlFor="calc-year" className="mb-2">
                    Year
                  </Label>
                  <Select
                    id="calc-year"
                    name="year"
                    value={calculationForm.year}
                    onChange={handleInputChange}
                    className="w-full"
                  >
                    {years.map((year) => (
                      <SelectOption key={year} value={year}>
                        {year}
                      </SelectOption>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="flex align-items-center">
                    <Label htmlFor="workingDays" className="mr-3">
                      Working Days
                    </Label>
                    <Tag
                      severity="info"
                      value="Auto-calculated from attendance"
                    ></Tag>
                  </div>
                  <Input
                    id="workingDays"
                    type="number"
                    name="workingDays"
                    value={calculatedWorkingDays}
                    onChange={handleInputChange}
                    disabled
                    tooltip="Working days will be automatically calculated from employee attendance records"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>

                <div>
                  <div className="flex align-items-center">
                    <Label htmlFor="daysOff" className="mr-3">
                      Days Off
                    </Label>
                    <Tag
                      severity="info"
                      value="Auto-calculated: ≥7h=full day, 4-7h=half day"
                    ></Tag>
                  </div>
                  <Input
                    id="daysOff"
                    type="number"
                    name="daysOff"
                    value={calculationForm.daysOff}
                    onChange={handleInputChange}
                    tooltip="Days off are calculated based on attendance records: days with ≥7 hours count as full days, 4-7 hours as half days, and the rest as days off"
                    tooltipOptions={{ position: "top" }}
                  />
                </div>

                <div>
                  <Label htmlFor="overtimesoon" className="mb-2">
                    Overtime (soon) Hours
                  </Label>
                  <Input
                    id="overtimesoon"
                    type="number"
                    name="overtimesoon"
                    value={calculationForm.overtimesoon}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="overtimelate" className="mb-2">
                    Overtime (late) Hours
                  </Label>
                  <Input
                    id="overtimelate"
                    type="number"
                    name="overtimelate"
                    value={calculationForm.overtimelate}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="bonus" className="mb-2">
                    Bonus
                  </Label>
                  <Input
                    id="bonus"
                    type="number"
                    name="bonus"
                    value={calculationForm.bonus}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-probation"
                    name="isProbation"
                    checked={calculationForm.isProbation}
                    onChange={handleInputChange}
                  />
                  <Label htmlFor="is-probation">
                    Employee(s) on probation (85% of full salary)
                  </Label>
                </div>
              </div>

              <div className="mt-4 text-muted-foreground text-sm">
                <p>
                  Note: Fixed allowances (food, clothes, parking, fuel, house
                  rent, phone) will be automatically applied from each
                  employee's profile.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={calculateSalaries} disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner mr-2"></div> Calculating...
                  </>
                ) : (
                  "Calculate Salaries"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Salary;
