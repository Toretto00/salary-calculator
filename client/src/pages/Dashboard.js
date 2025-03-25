import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, Calculator, BarChart } from "lucide-react";

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Employees</CardTitle>
            </div>
            <CardDescription>
              Manage employee information and records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Add new employees, update existing records, and manage employee
              details.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/employees">Manage Employees</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2 mb-2">
              <Calculator className="h-6 w-6 text-primary" />
              <CardTitle>Salary Calculations</CardTitle>
            </div>
            <CardDescription>
              Calculate and manage employee salaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Calculate salaries, view past calculations, and export salary
              reports.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/salary">Manage Salaries</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart className="h-6 w-6 text-primary" />
              <CardTitle>Reports</CardTitle>
            </div>
            <CardDescription>Generate and export reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Generate and export salary reports in Excel format for accounting
              purposes.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/reports">View Reports</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
