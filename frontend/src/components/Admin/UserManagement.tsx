// frontend/src/components/Admin/UserManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types'; // Import User type
import { motion } from 'framer-motion';

export default function UserManagement() {
  const { isAuthenticated, isAdmin, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Define API_BASE_URL based on environment variable
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !isAdmin || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    console.log("Fetching users with token:", token);
    try {
      // Use API_BASE_URL and explicitly add /api/admin/users
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch users.');
      }
      const data: User[] = await response.json();
      setUsers(data);
      console.log("UserManagement: Fetched users:", data);
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching users.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, token, API_BASE_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async (userId: number, newRole: string) => {
    if (!isAuthenticated || !isAdmin || !token) {
      setMessage('You are not authorized to perform this action.');
      return;
    }
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/admin/users
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user role.');
      }
      setMessage('User role updated successfully!');
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Error updating user role:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while updating user role.');
      }
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!isAuthenticated || !isAdmin || !token) {
      setMessage('You are not authorized to perform this action.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/admin/users
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user.');
      }
      setMessage(`User "${username}" deleted successfully!`);
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error("Error deleting user:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while deleting user.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-xl">Loading user data...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-400 mb-4 text-center">Access Denied</h1>
        <p className="text-xl text-center max-w-2xl">
          You do not have administrative privileges to view this page.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <h1 className="text-4xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-8 text-center">
        User Management
      </h1>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
        {message && (
          <div className={`p-3 rounded-md text-sm mb-4 ${message.includes('successfully') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-md text-sm mb-4 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Active
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-crawfordBlue focus:border-crawfordBlue sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.is_active ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
