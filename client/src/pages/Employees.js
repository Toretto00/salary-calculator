import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { employeeService } from "../api/api";

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
      allowances: employee.allowances,
    });
    setShowModal(true);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "dependents" || name === "salary"
          ? parseInt(value) || 0
          : value,
    }));
  };

  // Handle nested changes for allowances
  const handleNestedChange = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [field]: value,
      },
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (currentEmployee) {
        // Update existing employee
        await employeeService.update(currentEmployee.id, formData);
      } else {
        // Create new employee
        await employeeService.create(formData);
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
    <div className="dashboard-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees Management</h1>
        <div>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            onClick={openAddModal}
          >
            Add Employee
          </button>
          <Link
            to="/dashboard"
            className="ml-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading employees...</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Gross Salary</th>
                  <th>Dependents</th>
                  <th>Status</th>
                  <th>Nationality</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No employees found. Add your first employee!
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.fullname}</td>
                      <td>
                        {employee.salary ? employee.salary.toLocaleString() : 0}
                      </td>
                      <td>{employee.dependents}</td>
                      <td>
                        {employee.probation === "yes"
                          ? "Probation"
                          : "Official"}
                      </td>
                      <td>
                        {employee.nationality === "vietnamese"
                          ? "Vietnamese"
                          : "Other"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-edit mr-2"
                          onClick={() => openEditModal(employee)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(employee.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {currentEmployee ? "Edit Employee" : "Add New Employee"}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fullname">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullname"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="salary">Gross Salary</label>
                  <input
                    type="number"
                    className="form-control"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dependents">Number of Dependents</label>
                  <input
                    type="number"
                    className="form-control"
                    id="dependents"
                    name="dependents"
                    value={formData.dependents}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Employment Status</label>
                  <div>
                    <label className="inline-flex items-center mr-4">
                      <input
                        type="radio"
                        name="probation"
                        value="yes"
                        checked={formData.probation === "yes"}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Probation (85% salary)
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="probation"
                        value="no"
                        checked={formData.probation === "no"}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Official (100% salary)
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Nationality</label>
                  <div>
                    <label className="inline-flex items-center mr-4">
                      <input
                        type="radio"
                        name="nationality"
                        value="vietnamese"
                        checked={formData.nationality === "vietnamese"}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Vietnamese
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="nationality"
                        value="other"
                        checked={formData.nationality === "other"}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      Other
                    </label>
                  </div>
                </div>

                {/* Allowances Section */}
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Fixed Monthly Allowances
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label" htmlFor="allowances.food">
                        Food Allowance
                      </label>
                      <input
                        type="number"
                        id="allowances.food"
                        name="allowances.food"
                        className="input"
                        value={formData.allowances?.food || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "allowances",
                            "food",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="allowances.clothes"
                      >
                        Clothes Allowance
                      </label>
                      <input
                        type="number"
                        id="allowances.clothes"
                        name="allowances.clothes"
                        className="input"
                        value={formData.allowances?.clothes || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "allowances",
                            "clothes",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="allowances.parking"
                      >
                        Parking Allowance
                      </label>
                      <input
                        type="number"
                        id="allowances.parking"
                        name="allowances.parking"
                        className="input"
                        value={formData.allowances?.parking || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "allowances",
                            "parking",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="allowances.fuel">
                        Fuel Allowance
                      </label>
                      <input
                        type="number"
                        id="allowances.fuel"
                        name="allowances.fuel"
                        className="input"
                        value={formData.allowances?.fuel || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "allowances",
                            "fuel",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="allowances.houseRent"
                      >
                        House Rent Allowance
                      </label>
                      <input
                        type="number"
                        id="allowances.houseRent"
                        name="allowances.houseRent"
                        className="input"
                        value={formData.allowances?.houseRent || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "allowances",
                            "houseRent",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="allowances.phone">
                        Phone Allowance
                      </label>
                      <input
                        type="number"
                        id="allowances.phone"
                        name="allowances.phone"
                        className="input"
                        value={formData.allowances?.phone || 0}
                        onChange={(e) =>
                          handleNestedChange(
                            "allowances",
                            "phone",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    {currentEmployee ? "Update" : "Add"} Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
