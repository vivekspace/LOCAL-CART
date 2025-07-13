// src/components/Auth/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/Context';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ roles = [], redirectPath = '/login' }) => {
  const { auth } = useAuth();
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Small delay to ensure auth state is settled
    const timer = setTimeout(() => {
      setIsAuthChecked(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  console.log("ProtectedRoute - Auth state:", {
    isLoading: auth.isAuthLoading,
    token: !!auth.token,
    user: auth.user,
    role: auth.user?.role,
    isAuthChecked
  });

  if (auth.isAuthLoading || !isAuthChecked) {
    console.log("ProtectedRoute - Waiting for auth verification");
    return <Loader />;
  }

  if (!auth.token || !auth.user) {
    console.log("ProtectedRoute - Not authenticated, redirecting to login");
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(auth.user.role)) {
    console.log(`ProtectedRoute - Role ${auth.user.role} not authorized, redirecting`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("ProtectedRoute - Access granted");
  return <Outlet />;
};

export default ProtectedRoute;