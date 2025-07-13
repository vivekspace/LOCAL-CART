// src/components/RoleBasedRoute/RoleBasedRoute.jsx
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/Context';
import { toast } from 'react-toastify';
import Loader from '../Loader/Loader';

const RoleBasedRoute = ({ allowedRoles, redirectPath }) => {
  // FIXED: Use correct property names from your AuthProvider
  const { isAuthLoading, jwtToken, user, isLoggedIn, currentRole } = useAuth();
  const location = useLocation();

  console.log("RoleBasedRoute: Executing for path:", location.pathname);
  console.log("RoleBasedRoute: isAuthLoading:", isAuthLoading);
  console.log("RoleBasedRoute: isLoggedIn:", isLoggedIn);
  console.log("RoleBasedRoute: currentRole:", currentRole);
  console.log("RoleBasedRoute: allowedRoles:", allowedRoles);

  // Show loader while authentication is being checked
  if (isAuthLoading) {
    console.log("RoleBasedRoute: Showing loader (Auth loading).");
    return <Loader fullScreen />;
  }

  // FIXED: Check for correct token property
  if (!isLoggedIn || !jwtToken) {
    console.log("RoleBasedRoute: Redirecting: User not logged in or no token.");
    return <Navigate
      to={redirectPath || '/login'}
      replace
      state={{ from: location }}
    />;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(currentRole);
  console.log("RoleBasedRoute: User role check. Has required role?", hasRequiredRole);

  if (!hasRequiredRole) {
    console.log("RoleBasedRoute: Redirecting: Insufficient role.");
    toast.error(`You don't have permission to access this page.`);

    // IMPROVED: Better fallback logic to prevent redirect loops
    let fallbackPath = '/';
    switch (currentRole) {
      case 'admin':
        // Only redirect to admin panel if we're not already trying to access it
        fallbackPath = location.pathname.startsWith('/admin') ? '/' : '/admin/panel';
        break;
      case 'seller':
        fallbackPath = location.pathname.startsWith('/vendor') ? '/' : '/vendor/dashboard';
        break;
      case 'customer':
        fallbackPath = location.pathname.startsWith('/user') ? '/' : '/user-dashboard';
        break;
      default:
        fallbackPath = '/';
    }
    return <Navigate to={fallbackPath} replace />;
  }

  console.log("RoleBasedRoute: User has required role. Rendering Outlet.");
  return <Outlet />;
};

export default RoleBasedRoute;