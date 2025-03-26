import React, { useState, useEffect } from "react";
import { formatCurrency, parseCurrency } from "../utils/format";

const EmployeeForm = ({ employee, onSubmit, onDelete }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    id: "",
    idNumber: "",
    jobTitle: "",
    email: "",
    contractStatus: "official",
    dependents: 0,
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    salary: "",
    allowances: {
      food: "",
      clothes: "",
      parking: "",
      fuel: "",
      houseRent: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        salary: formatCurrency(employee.salary),
        allowances: {
          food: formatCurrency(employee.allowances?.food || 0),
          clothes: formatCurrency(employee.allowances?.clothes || 0),
          parking: formatCurrency(employee.allowances?.parking || 0),
          fuel: formatCurrency(employee.allowances?.fuel || 0),
          houseRent: formatCurrency(employee.allowances?.houseRent || 0),
          phone: formatCurrency(employee.allowances?.phone || 0),
        },
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle currency inputs
    if (name === "salary" || name.startsWith("allowances.")) {
      // Remove all non-digit characters
      const numericValue = value.replace(/\D/g, "");
      // Format the number
      const formattedValue = formatCurrency(numericValue);

      if (name.startsWith("allowances.")) {
        const allowanceKey = name.split(".")[1];
        setFormData((prev) => ({
          ...prev,
          allowances: {
            ...prev.allowances,
            [allowanceKey]: formattedValue,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: formattedValue,
        }));
      }
    } else {
      // Handle non-currency inputs normally
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      salary: parseCurrency(formData.salary),
      allowances: {
        food: parseCurrency(formData.allowances.food),
        clothes: parseCurrency(formData.allowances.clothes),
        parking: parseCurrency(formData.allowances.parking),
        fuel: parseCurrency(formData.allowances.fuel),
        houseRent: parseCurrency(formData.allowances.houseRent),
        phone: parseCurrency(formData.allowances.phone),
      },
    };
    onSubmit(formattedData);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      onDelete(employee.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Employee ID
          </label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ID Number
          </label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contract Status
          </label>
          <select
            name="contractStatus"
            value={formData.contractStatus}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="official">Official Contract</option>
            <option value="temporary">Temporary Contract</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Dependents
          </label>
          <input
            type="number"
            name="dependents"
            value={formData.dependents}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Salary
          </label>
          <input
            type="text"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Food Allowance
          </label>
          <input
            type="text"
            name="allowances.food"
            value={formData.allowances.food}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Clothes Allowance
          </label>
          <input
            type="text"
            name="allowances.clothes"
            value={formData.allowances.clothes}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Parking Allowance
          </label>
          <input
            type="text"
            name="allowances.parking"
            value={formData.allowances.parking}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Fuel Allowance
          </label>
          <input
            type="text"
            name="allowances.fuel"
            value={formData.allowances.fuel}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            House Rent Allowance
          </label>
          <input
            type="text"
            name="allowances.houseRent"
            value={formData.allowances.houseRent}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone Allowance
          </label>
          <input
            type="text"
            name="allowances.phone"
            value={formData.allowances.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bank Name
          </label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bank Account Name
          </label>
          <input
            type="text"
            name="bankAccountName"
            value={formData.bankAccountName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bank Account Number
          </label>
          <input
            type="text"
            name="bankAccountNumber"
            value={formData.bankAccountNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {employee && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Employee
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {employee ? "Update Employee" : "Add Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
