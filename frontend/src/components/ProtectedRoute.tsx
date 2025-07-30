// frontend/src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import your AuthContext

interface ProtectedRouteProps {
  children?: React.ReactNode; // For wrapping components directly if needed
  requiredAdmin?: boolean; // Add this line
}

export default function ProtectedRoute({ children, requiredAdmin }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth(); // Get authentication status from your context

  // While authentication status is being determined, you might show a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading user data...</p>
        {/* You can replace this with a proper loading spinner */}
      </div>
    );
  }

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // 'replace' prevents going back to the protected route
  }

  // If admin is required and user is not admin, redirect
  if (requiredAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child routes/components
  return children ? <>{children}</> : <Outlet />;
}