import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/Context';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ roles = [], redirectPath = '/login' }) => {
  const { auth } = useAuth();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
   
    const timer = setTimeout(() => {
      setIsAuthChecked(true);
    }, 100); // A small delay like 50-100ms is usually sufficient

    return () => clearTimeout(timer);
  }, []);

  console.log("ProtectedRoute - Auth state:", {
    isLoading: auth.isAuthLoading,
    // IMPORTANT: Changed from auth.token to auth.jwtToken
    tokenExists: !!auth.jwtToken, // Check if jwtToken exists
    user: auth.user,
    role: auth.user?.role,
    isAuthChecked
  });

  
  if (auth.isAuthLoading || !isAuthChecked) {
    console.log("ProtectedRoute - Waiting for auth verification");
    return <Loader />;
  }

  if (!auth.jwtToken || !auth.user) {
    console.log("ProtectedRoute - Not authenticated (missing token or user), redirecting to login");
    // Pass the current location to the login page so it can redirect back after successful login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Check if the authenticated user's role is authorized for this route
  if (roles.length > 0 && !roles.includes(auth.user.role)) {
    console.log(`ProtectedRoute - Role '${auth.user.role}' not authorized for this route, redirecting to unauthorized page`);
    return <Navigate to="/unauthorized" replace />; // Redirect to an unauthorized page
  }

  console.log("ProtectedRoute - Access granted for role:", auth.user.role);
  // If all checks pass, render the child components (the actual protected content)
  return <Outlet />;
};

export default ProtectedRoute;
