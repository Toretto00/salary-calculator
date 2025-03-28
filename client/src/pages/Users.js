import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userService, employeeService } from "../api/api";
import { useToast } from "../hooks/use-toast";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Select, SelectOption } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  AlertCircle,
  Edit,
  Key,
  MoreHorizontal,
  Plus,
  Trash,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";

const Users = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    username: "",
    name: "",
    role: "user",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newEmployeeUser, setNewEmployeeUser] = useState({
    employeeId: "",
    role: "user",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFromEmployeeDialogOpen, setIsFromEmployeeDialogOpen] = useState(false);
  const [passwordResetInfo, setPasswordResetInfo] = useState(null);

  // Fetch users data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Only proceed if the current user is an admin
        if (user && user.role === "admin") {
          const usersData = await userService.getAll();
          setUsers(usersData);
          // Also fetch employees for creating user accounts
          const employeesData = await employeeService.getAll();
          setEmployees(employeesData);
        } else {
          setError("Admin access required");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load users. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle form field changes for new user
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.role) {
      toast({
        title: "Validation Error",
        description: "Username and role are required",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      const result = await userService.create(newUser);
      setUsers((prev) => [...prev, result.user]);
      setIsAddDialogOpen(false);
      setNewUser({ username: "", name: "", role: "user" });
      toast({
        title: "User Created",
        description: `User ${result.user.username} created successfully. Generated password: ${result.generatedPassword}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Create user from employee
  const handleCreateFromEmployee = async () => {
    if (!newEmployeeUser.employeeId || !newEmployeeUser.role) {
      toast({
        title: "Validation Error",
        description: "Employee and role are required",
        variant: "destructive",
      });
      return;
    }

    setLoadingAction(true);
    try {
      const result = await userService.createFromEmployee(
        newEmployeeUser.employeeId,
        newEmployeeUser.role
      );
      setUsers((prev) => [...prev, result.user]);
      setIsFromEmployeeDialogOpen(false);
      setNewEmployeeUser({ employeeId: "", role: "user" });
      toast({
        title: "User Created",
        description: `User created for employee successfully. Generated password: ${result.generatedPassword}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user from employee",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser || !selectedUser.id) return;

    setLoadingAction(true);
    try {
      const result = await userService.update(selectedUser.id, {
        name: selectedUser.name,
        role: selectedUser.role,
      });
      
      setUsers((prev) =>
        prev.map((u) => (u.id === result.id ? result : u))
      );
      
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: `User ${result.username} updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    setLoadingAction(true);
    try {
      await userService.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Reset user password
  const handleResetPassword = async (userId) => {
    setLoadingAction(true);
    try {
      const result = await userService.resetPassword(userId);
      setPasswordResetInfo(result);
      toast({
        title: "Success",
        description: "Password reset successful",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Open edit dialog with user data
  const openEditDialog = (user) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // Find employee name by ID
  const getEmployeeNameById = (employeeId) => {
    if (!employeeId) return "N/A";
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.fullname : "Unknown";
  };

  // Get available employees (those who don't have a user account yet)
  const getAvailableEmployees = () => {
    const employeeIdsWithUsers = users
      .filter((u) => u.employeeId)
      .map((u) => u.employeeId);
    
    return employees.filter((e) => !employeeIdsWithUsers.includes(e.id));
  };

  // Check if current user has admin role
  if (!user || user.role !== "admin") {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading users...</div>;
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

  const availableEmployees = getAvailableEmployees();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Password Reset Info Alert */}
      {passwordResetInfo && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <Key className="h-4 w-4" />
          <AlertTitle>Password Reset Successful</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p><strong>Username:</strong> {passwordResetInfo.username}</p>
              <p><strong>New Password:</strong> {passwordResetInfo.newPassword}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please securely share this information with the user.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setPasswordResetInfo(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="admin">Admins</TabsTrigger>
            <TabsTrigger value="user">Standard Users</TabsTrigger>
          </TabsList>

          <div className="flex justify-end gap-2 mt-4">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user account to the system
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      value={newUser.username}
                      onChange={handleInputChange}
                      className="col-span-3"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newUser.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <div className="col-span-3">
                      <Select
                        id="role"
                        value={newUser.role}
                        onChange={(e) => 
                          setNewUser((prev) => ({ ...prev, role: e.target.value }))
                        }
                        className="w-full"
                      >
                        <SelectOption value="admin">Admin</SelectOption>
                        <SelectOption value="user">User</SelectOption>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={loadingAction}
                  >
                    {loadingAction ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isFromEmployeeDialogOpen}
              onOpenChange={setIsFromEmployeeDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create From Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create User From Employee</DialogTitle>
                  <DialogDescription>
                    Create a user account for an existing employee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {availableEmployees.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Available Employees</AlertTitle>
                      <AlertDescription>
                        All employees already have user accounts.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="employeeId" className="text-right">
                          Employee
                        </Label>
                        <div className="col-span-3">
                          <Select
                            id="employeeId"
                            value={newEmployeeUser.employeeId}
                            onChange={(e) =>
                              setNewEmployeeUser((prev) => ({
                                ...prev,
                                employeeId: e.target.value,
                              }))
                            }
                            className="w-full"
                          >
                            <SelectOption value="">Select employee</SelectOption>
                            {availableEmployees.map((employee) => (
                              <SelectOption
                                key={employee.id}
                                value={employee.id.toString()}
                              >
                                {employee.fullname} ({employee.email})
                              </SelectOption>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="employee-role" className="text-right">
                          Role
                        </Label>
                        <div className="col-span-3">
                          <Select
                            id="employee-role"
                            value={newEmployeeUser.role}
                            onChange={(e) =>
                              setNewEmployeeUser((prev) => ({
                                ...prev,
                                role: e.target.value,
                              }))
                            }
                            className="w-full"
                          >
                            <SelectOption value="admin">Admin</SelectOption>
                            <SelectOption value="user">User</SelectOption>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsFromEmployeeDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateFromEmployee}
                    disabled={loadingAction || availableEmployees.length === 0}
                  >
                    {loadingAction ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="all" className="mt-6">
            <UsersTable
              users={users}
              employees={employees}
              getEmployeeNameById={getEmployeeNameById}
              openEditDialog={openEditDialog}
              handleDeleteUser={handleDeleteUser}
              handleResetPassword={handleResetPassword}
              loadingAction={loadingAction}
            />
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <UsersTable
              users={users.filter((u) => u.role === "admin")}
              employees={employees}
              getEmployeeNameById={getEmployeeNameById}
              openEditDialog={openEditDialog}
              handleDeleteUser={handleDeleteUser}
              handleResetPassword={handleResetPassword}
              loadingAction={loadingAction}
            />
          </TabsContent>

          <TabsContent value="user" className="mt-6">
            <UsersTable
              users={users.filter((u) => u.role === "user")}
              employees={employees}
              getEmployeeNameById={getEmployeeNameById}
              openEditDialog={openEditDialog}
              handleDeleteUser={handleDeleteUser}
              handleResetPassword={handleResetPassword}
              loadingAction={loadingAction}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Username</Label>
                <div className="col-span-3">
                  <Input
                    value={selectedUser.username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Username cannot be changed
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={selectedUser.name || ""}
                  onChange={(e) =>
                    setSelectedUser((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <div className="col-span-3">
                  <Select
                    id="edit-role"
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full"
                  >
                    <SelectOption value="admin">Admin</SelectOption>
                    <SelectOption value="user">User</SelectOption>
                  </Select>
                </div>
              </div>
              {selectedUser.employeeId && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Linked Employee</Label>
                  <div className="col-span-3">
                    <Input
                      value={getEmployeeNameById(selectedUser.employeeId)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={loadingAction}
            >
              {loadingAction ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Users table component
const UsersTable = ({
  users,
  employees,
  getEmployeeNameById,
  openEditDialog,
  handleDeleteUser,
  handleResetPassword,
  loadingAction,
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Linked Employee</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "destructive" : "default"}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.employeeId
                    ? getEmployeeNameById(user.employeeId)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleResetPassword(user.id)}
                        disabled={loadingAction}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the user account.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loadingAction}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {loadingAction ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default Users;
