import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { attendanceService, formatDate, formatTime } from "../api/api";
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
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Clock,
  CheckSquare,
  AlertCircle,
  TimerOff,
  Timer,
  Calendar,
  ClipboardList,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";

const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Get current attendance status
  const fetchAttendanceStatus = useCallback(async () => {
    try {
      const data = await attendanceService.getStatus();
      setAttendanceStatus(data);
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      toast({
        title: "Error",
        description: "Failed to load attendance status",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Get attendance history
  const fetchAttendanceHistory = useCallback(
    async (page = 1) => {
      try {
        const data = await attendanceService.getHistory(page, pagination.limit);
        setHistory(data.records);
        setPagination((prev) => ({
          ...prev,
          page,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
      } catch (error) {
        console.error("Error fetching attendance history:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance history",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchAttendanceStatus();
    fetchAttendanceHistory(1);
  }, [fetchAttendanceStatus, fetchAttendanceHistory]);

  // Handle check-in
  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      await attendanceService.checkIn(notes);

      toast({
        title: "Success",
        description: "You've successfully checked in",
        variant: "success",
      });

      // Reset notes
      setNotes("");

      // Refresh data
      fetchAttendanceStatus();
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      await attendanceService.checkOut(notes);

      toast({
        title: "Success",
        description: "You've successfully checked out",
        variant: "success",
      });

      // Reset notes
      setNotes("");

      // Refresh data
      fetchAttendanceStatus();
      fetchAttendanceHistory();
    } catch (error) {
      console.error("Check-out error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check out",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pagination change
  const handlePageChange = (page) => {
    fetchAttendanceHistory(page);
  };

  // Format duration (hours)
  const formatDuration = (hours) => {
    if (hours === undefined || hours === null) return "-";

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (wholeHours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${wholeHours} hr`;
    } else {
      return `${wholeHours} hr ${minutes} min`;
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge variant="success">Present</Badge>;
      case "absent":
        return <Badge variant="destructive">Absent</Badge>;
      case "leave":
        return <Badge variant="outline">Leave</Badge>;
      case "holiday":
        return <Badge variant="secondary">Holiday</Badge>;
      case "incomplete":
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const { page, pages } = pagination;

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => page > 1 && handlePageChange(page - 1)}
          isDisabled={page <= 1}
        />
      </PaginationItem>
    );

    // First page
    if (pages > 0) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={page === 1}
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis after first page
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Pages around current page
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(pages - 1, page + 1);
      i++
    ) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={page === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis before last page
    if (page < pages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Last page
    if (pages > 1) {
      items.push(
        <PaginationItem key={pages}>
          <PaginationLink
            isActive={page === pages}
            onClick={() => handlePageChange(pages)}
          >
            {pages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => page < pages && handlePageChange(page + 1)}
          isDisabled={page >= pages}
        />
      </PaginationItem>
    );

    return items;
  };

  if (!user) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Attendance Management</h1>

      <Tabs defaultValue="check-in-out" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="check-in-out">
            <Clock className="w-4 h-4 mr-2" />
            Check In/Out
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check-in-out">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Check-in/Check-out Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {attendanceStatus?.status === "checked-in"
                    ? "Currently Checked In"
                    : "Check-In / Check-Out"}
                </CardTitle>
                <CardDescription>
                  {attendanceStatus?.status === "not-checked-in" &&
                    "You haven't checked in today."}
                  {attendanceStatus?.status === "checked-in" &&
                    "You are currently checked in."}
                  {attendanceStatus?.status === "checked-out" &&
                    "You have completed your work for today."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Current Status Card */}
                {attendanceStatus && (
                  <div className="rounded-lg border p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-sm">Today's Status</h3>
                      {renderStatusBadge(
                        attendanceStatus.status === "checked-in"
                          ? "incomplete"
                          : attendanceStatus.attendance?.status || "absent"
                      )}
                    </div>

                    <Separator className="my-3" />

                    {attendanceStatus.status !== "not-checked-in" && (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                          <div>
                            <p className="text-muted-foreground">Check-in:</p>
                            <p className="font-medium">
                              {formatTime(
                                attendanceStatus.attendance?.checkIn.time
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Check-out:</p>
                            <p className="font-medium">
                              {attendanceStatus.attendance?.checkOut.time
                                ? formatTime(
                                    attendanceStatus.attendance.checkOut.time
                                  )
                                : "Not checked out"}
                            </p>
                          </div>
                        </div>

                        {attendanceStatus.attendance?.checkOut.time && (
                          <>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Working Hours:
                                </p>
                                <p className="font-medium">
                                  {formatDuration(
                                    attendanceStatus.attendance.workingHours
                                  )}
                                </p>
                              </div>

                              <div>
                                <p className="text-muted-foreground">
                                  Overtime:
                                </p>
                                <p className="font-medium">
                                  {formatDuration(
                                    attendanceStatus.attendance.overtime
                                  )}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Action Area */}
                <div>
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mb-4"
                    disabled={isLoading}
                  />

                  {attendanceStatus?.status === "not-checked-in" && (
                    <Button
                      onClick={handleCheckIn}
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Timer className="mr-2 h-4 w-4" />
                      Check In
                    </Button>
                  )}

                  {attendanceStatus?.status === "checked-in" && (
                    <Button
                      onClick={handleCheckOut}
                      className="w-full"
                      variant="secondary"
                      disabled={isLoading}
                    >
                      <TimerOff className="mr-2 h-4 w-4" />
                      Check Out
                    </Button>
                  )}

                  {attendanceStatus?.status === "checked-out" && (
                    <Alert>
                      <CheckSquare className="h-4 w-4" />
                      <AlertTitle>All Done!</AlertTitle>
                      <AlertDescription>
                        You have already completed your work for today.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="mr-2 h-5 w-5" />
                  This Month's Summary
                </CardTitle>
                <CardDescription>
                  Your attendance statistics for the current month
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-muted-foreground text-sm">
                      Present Days
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {history.filter((r) => r.status === "present").length}
                    </p>
                  </div>

                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-muted-foreground text-sm">Total Hours</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatDuration(
                        history.reduce(
                          (sum, record) => sum + record.workingHours,
                          0
                        )
                      )}
                    </p>
                  </div>

                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-muted-foreground text-sm">
                      Overtime Hours
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {formatDuration(
                        history.reduce(
                          (sum, record) => sum + record.overtime,
                          0
                        )
                      )}
                    </p>
                  </div>

                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-muted-foreground text-sm">
                      Avg. Hours/Day
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {formatDuration(
                        history.length > 0
                          ? history.reduce(
                              (sum, record) => sum + record.workingHours,
                              0
                            ) /
                              history.filter((r) => r.status === "present")
                                .length
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Attendance History
              </CardTitle>
              <CardDescription>View your attendance records</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Working Hours</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {history.length > 0 ? (
                      history.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {formatDate(record.date)}
                          </TableCell>
                          <TableCell>
                            {formatTime(record.checkIn.time)}
                            {record.checkIn.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Note: {record.checkIn.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.checkOut.time ? (
                              <>
                                {formatTime(record.checkOut.time)}
                                {record.checkOut.notes && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Note: {record.checkOut.notes}
                                  </div>
                                )}
                              </>
                            ) : (
                              "Not checked out"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDuration(record.workingHours)}
                          </TableCell>
                          <TableCell>
                            {formatDuration(record.overtime)}
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(record.status)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {pagination.pages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    {generatePaginationItems()}
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Attendance;
