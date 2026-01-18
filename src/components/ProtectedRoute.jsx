// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../api/auth";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
