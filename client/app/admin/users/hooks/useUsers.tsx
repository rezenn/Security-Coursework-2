import { useState, useEffect, useCallback } from "react";
import { getAllUsers } from "@/lib/api/admin/user";

export const useUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
  });

  const calculateStats = useCallback((usersData: any[]) => {
    const normalUsers = usersData.filter((user: any) => user.role === "user");
    const totalUsers = normalUsers.length;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const newThisMonth = normalUsers.filter((user: any) => {
      const userDate = new Date(user.createdAt);
      const userYear = userDate.getFullYear();
      const userMonth = userDate.getMonth();
      return userYear === currentYear && userMonth === currentMonth;
    }).length;

    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    const newLastMonth = normalUsers.filter((user: any) => {
      const userDate = new Date(user.createdAt);
      const userYear = userDate.getFullYear();
      const userMonth = userDate.getMonth();
      return userYear === lastMonthYear && userMonth === lastMonth;
    }).length;

    return {
      totalUsers,
      newUsersThisMonth: newThisMonth,
      newUsersLastMonth: newLastMonth,
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getAllUsers();

      if (result.success) {
        setUsers(result.data);
        const newStats = calculateStats(result.data);
        setStats(newStats);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats]);

  const refreshUsers = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    stats,
    fetchUsers: refreshUsers,
    setUsers,
  };
};
