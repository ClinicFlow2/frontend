// src/routes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./auth/RequireAuth";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import PatientVisits from "./pages/PatientVisits";
import VisitDetail from "./pages/VisitDetail";
import Visits from "./pages/Visits";
import Prescriptions from "./pages/Prescriptions";
import NotFound from "./pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected dashboard area */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />

        {/* ✅ Global Visits module */}
        <Route path="visits" element={<Visits />} />

        {/* ✅ Prescriptions module */}
        <Route path="prescriptions" element={<Prescriptions />} />

        {/* ✅ Per-patient visits */}
        <Route path="patients/:id/visits" element={<PatientVisits />} />

        {/* ✅ Visit detail + vitals */}
        <Route path="patients/:id/visits/:visitId" element={<VisitDetail />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
