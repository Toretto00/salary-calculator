import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { employeeService, salaryService } from "../api/api";
import { formatCurrency } from "../utils/format";
import { useToast } from "../hooks/use-toast";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { AlertCircle, Download, User, Wallet } from "lucide-react";
import { Select, SelectOption } from "../components/ui/select";
import { Label } from "../components/ui/label";

const EmployeeProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Generate months array
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

  // Generate years array (current year and 2 years back)
  const years = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - i
  );

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        if (user && user.employeeId) {
          const employeeData = await employeeService.getById(user.employeeId);
          setEmployee(employeeData);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setError("Failed to load employee data");
      }
    };

    fetchEmployeeData();
  }, [user]);

  // Fetch salary data
  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        if (user && user.employeeId) {
          const salaryData = await salaryService.getByPeriod(
            currentMonth,
            currentYear
          );
          const employeeSalary = salaryData.find(
            (s) => s.employeeId === user.employeeId
          );
          setSalary(employeeSalary);
        }
      } catch (error) {
        console.error("Error fetching salary data:", error);
        setError("Failed to load salary data");
      } finally {
        setLoading(false);
      }
    };

    fetchSalaryData();
  }, [user, currentMonth, currentYear]);

  // Handle export payslip
  const handleExportPayslip = async () => {
    try {
      if (salary) {
        await salaryService.exportPayslip(salary.id);
        toast({
          title: "Success",
          description: "Payslip exported successfully",
        });
      }
    } catch (error) {
      console.error("Error exporting payslip:", error);
      toast({
        title: "Error",
        description: "Failed to export payslip",
        variant: "destructive",
      });
    }
  };

  if (!user || !user.employeeId) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in as an employee to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="salary">
            <Wallet className="w-4 h-4 mr-2" />
            Salary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your employee profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <p className="text-lg font-medium">{employee?.fullname}</p>
                </div>
                <div>
                  <Label>Employee ID</Label>
                  <p className="text-lg font-medium">{employee?.id}</p>
                </div>
                <div>
                  <Label>Job Title</Label>
                  <p className="text-lg font-medium">{employee?.jobTitle}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-lg font-medium">{employee?.email}</p>
                </div>
                <div>
                  <Label>Contract Status</Label>
                  <p className="text-lg font-medium">
                    {employee?.contractStatus === "official"
                      ? "Official"
                      : "Temporary"}
                  </p>
                </div>
                <div>
                  <Label>Bank Account</Label>
                  <p className="text-lg font-medium">
                    {employee?.bankAccountNumber}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Information</CardTitle>
              <CardDescription>View your salary details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-6">
                <div className="w-full md:w-36">
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

              {salary ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Gross Salary
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.grossSalary)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Total Benefits
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.totalBenefits)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Working Days
                          </TableCell>
                          <TableCell>{salary.workingDays}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Bonus</TableCell>
                          <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Taxable Income
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.taxableIncome)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Social Insurance
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.socialInsurance)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Health Insurance
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.healthInsurance)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Unemployment Insurance
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.unemploymentInsurance)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Total Tax
                          </TableCell>
                          <TableCell>
                            {formatCurrency(salary.totalTax)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">
                            Net Salary
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(salary.netSalary)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleExportPayslip}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Payslip
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Salary Data</AlertTitle>
                  <AlertDescription>
                    No salary calculation found for the selected period.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeProfile;
