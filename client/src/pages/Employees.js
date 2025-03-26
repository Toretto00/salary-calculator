import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { employeeService } from "../api/api";
import { formatCurrency, parseCurrency, formatter } from "../utils/format";

// Import our new UI components
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "",
    salary: 0,
    dependents: 0,
    probation: "no",
    nationality: "vietnamese",
    idNumber: "",
    jobTitle: "",
    email: "",
    contractStatus: "official",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    allowances: {
      food: 0,
      clothes: 0,
      parking: 0,
      fuel: 0,
      houseRent: 0,
      phone: 0,
    },
  });

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
      setError("");
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for adding new employee
  const openAddModal = () => {
    setCurrentEmployee(null);
    setFormData({
      fullname: "",
      salary: 0,
      dependents: 0,
      probation: "no",
      nationality: "vietnamese",
      idNumber: "",
      jobTitle: "",
      email: "",
      contractStatus: "official",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      allowances: {
        food: 0,
        clothes: 0,
        parking: 0,
        fuel: 0,
        houseRent: 0,
        phone: 0,
      },
    });
    setShowModal(true);
  };

  // Open modal for editing employee
  const openEditModal = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      fullname: employee.fullname,
      salary: employee.salary || 0,
      dependents: employee.dependents,
      probation: employee.probation,
      nationality: employee.nationality,
      idNumber: employee.idNumber || "",
      jobTitle: employee.jobTitle || "",
      email: employee.email || "",
      contractStatus: employee.contractStatus || "official",
      bankName: employee.bankName || "",
      bankAccountName: employee.bankAccountName || "",
      bankAccountNumber: employee.bankAccountNumber || "",
      allowances: employee.allowances,
    });
    setShowModal(true);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle currency inputs
    if (name === "salary") {
      // Remove all non-digit characters
      const numericValue = value.replace(/\D/g, "");
      // Format the number
      const formattedValue = formatter.format(parseFloat(numericValue));
      console.log(formattedValue);
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle nested changes for allowances
  const handleNestedChange = (parent, field, value) => {
    // Handle currency inputs for allowances
    if (parent === "allowances") {
      // Remove all non-digit characters
      const numericValue = value.toString().replace(/\D/g, "");
      // Format the number
      const formattedValue = formatter.format(parseFloat(numericValue));
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: formattedValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value,
        },
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        salary: parseCurrency(formData.salary),
        allowances: {
          food: parseCurrency(formData.allowances?.food || "0"),
          clothes: parseCurrency(formData.allowances?.clothes || "0"),
          parking: parseCurrency(formData.allowances?.parking || "0"),
          fuel: parseCurrency(formData.allowances?.fuel || "0"),
          houseRent: parseCurrency(formData.allowances?.houseRent || "0"),
          phone: parseCurrency(formData.allowances?.phone || "0"),
        },
      };

      if (currentEmployee) {
        // Update existing employee
        await employeeService.update(currentEmployee.id, formattedData);
      } else {
        // Create new employee
        await employeeService.create(formattedData);
      }

      // Refresh employee list
      fetchEmployees();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving employee:", error);
      setError("Failed to save employee. Please try again.");
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await employeeService.delete(id);
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        setError("Failed to delete employee. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees Management</h1>
        <div className="flex space-x-4">
          <Button variant="default" onClick={openAddModal}>
            Add Employee
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
          {error}
          <button className="float-right" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="spinner mr-2"></div> Loading employees...
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>ID/Passport</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contract Status</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Dependents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan="11" className="text-center py-4">
                        <div className="spinner mr-2"></div> Loading
                        employees...
                      </TableCell>
                    </TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="11" className="text-center py-4">
                        No employees found. Add your first employee!
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.id}</TableCell>
                        <TableCell>{employee.fullname}</TableCell>
                        <TableCell>{employee.idNumber || "N/A"}</TableCell>
                        <TableCell>{employee.jobTitle || "N/A"}</TableCell>
                        <TableCell>{employee.email || "N/A"}</TableCell>
                        <TableCell>
                          {employee.contractStatus === "official"
                            ? "Official"
                            : "Temporary"}
                        </TableCell>
                        <TableCell>
                          {employee.salary
                            ? employee.salary.toLocaleString()
                            : 0}
                        </TableCell>
                        <TableCell>{employee.dependents}</TableCell>
                        <TableCell>
                          {employee.probation === "yes"
                            ? "Probation"
                            : "Regular"}
                        </TableCell>
                        <TableCell>
                          {employee.nationality === "vietnamese"
                            ? "Vietnamese"
                            : "Other"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(employee)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl mx-auto max-h-[90vh] flex flex-col">
            <CardHeader className="flex-none">
              <div className="flex justify-between items-center">
                <CardTitle>
                  {currentEmployee ? "Edit Employee" : "Add New Employee"}
                </CardTitle>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowModal(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="grid gap-4 flex-1">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input
                          type="text"
                          id="fullname"
                          name="fullname"
                          value={formData.fullname}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="idNumber">ID/Passport Number</Label>
                        <Input
                          type="text"
                          id="idNumber"
                          name="idNumber"
                          value={formData.idNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          type="text"
                          id="jobTitle"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contract & Status Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Contract & Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contract Status</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="contract-official"
                              name="contractStatus"
                              value="official"
                              checked={formData.contractStatus === "official"}
                              onChange={handleChange}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="contract-official">
                              Official Contract
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="contract-temporary"
                              name="contractStatus"
                              value="temporary"
                              checked={formData.contractStatus === "temporary"}
                              onChange={handleChange}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="contract-temporary">
                              Temporary Contract
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Employment Status</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="probation-yes"
                              name="probation"
                              value="yes"
                              checked={formData.probation === "yes"}
                              onChange={handleChange}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="probation-yes">
                              Probation (85% salary)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="probation-no"
                              name="probation"
                              value="no"
                              checked={formData.probation === "no"}
                              onChange={handleChange}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="probation-no">
                              Regular (100% salary)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Nationality</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="nat-vietnamese"
                              name="nationality"
                              value="vietnamese"
                              checked={formData.nationality === "vietnamese"}
                              onChange={handleChange}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="nat-vietnamese">Vietnamese</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="nat-other"
                              name="nationality"
                              value="other"
                              checked={formData.nationality === "other"}
                              onChange={handleChange}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="nat-other">Other</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bank Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          type="text"
                          id="bankName"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAccountName">
                          Bank Account Name
                        </Label>
                        <Input
                          type="text"
                          id="bankAccountName"
                          name="bankAccountName"
                          value={formData.bankAccountName}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">
                          Bank Account Number
                        </Label>
                        <Input
                          type="text"
                          id="bankAccountNumber"
                          name="bankAccountNumber"
                          value={formData.bankAccountNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Salary Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary">Gross Salary</Label>
                        <Input
                          type="text"
                          id="salary"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dependents">Number of Dependents</Label>
                        <Input
                          type="number"
                          id="dependents"
                          name="dependents"
                          value={formData.dependents}
                          onChange={handleChange}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Allowances Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Fixed Monthly Allowances
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="allowances.food">Food Allowance</Label>
                        <Input
                          type="text"
                          id="allowances.food"
                          name="allowances.food"
                          value={formData.allowances?.food || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "allowances",
                              "food",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowances.clothes">
                          Clothes Allowance
                        </Label>
                        <Input
                          type="text"
                          id="allowances.clothes"
                          name="allowances.clothes"
                          value={formData.allowances?.clothes || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "allowances",
                              "clothes",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowances.parking">
                          Parking Allowance
                        </Label>
                        <Input
                          type="text"
                          id="allowances.parking"
                          name="allowances.parking"
                          value={formData.allowances?.parking || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "allowances",
                              "parking",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowances.fuel">Fuel Allowance</Label>
                        <Input
                          type="text"
                          id="allowances.fuel"
                          name="allowances.fuel"
                          value={formData.allowances?.fuel || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "allowances",
                              "fuel",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowances.houseRent">
                          House Rent Allowance
                        </Label>
                        <Input
                          type="text"
                          id="allowances.houseRent"
                          name="allowances.houseRent"
                          value={formData.allowances?.houseRent || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "allowances",
                              "houseRent",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowances.phone">
                          Phone Allowance
                        </Label>
                        <Input
                          type="text"
                          id="allowances.phone"
                          name="allowances.phone"
                          value={formData.allowances?.phone || ""}
                          onChange={(e) =>
                            handleNestedChange(
                              "allowances",
                              "phone",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {currentEmployee ? "Update" : "Add"} Employee
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Employees;
