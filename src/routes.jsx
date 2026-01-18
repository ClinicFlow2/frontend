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

// Placeholder until you implement it
function AppointmentsPlaceholder() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Appointments</h1>
      <p>This module is next: scheduling + daily agenda.</p>
    </div>
  );
}

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

        {/* ✅ Per-patient visits */}
        <Route path="patients/:id/visits" element={<PatientVisits />} />

        {/* ✅ Visit detail + vitals */}
        <Route path="patients/:id/visits/:visitId" element={<VisitDetail />} />

        {/* ✅ Prescriptions */}
        <Route path="prescriptions" element={<Prescriptions />} />

        {/* ✅ Appointments (placeholder for now) */}
        <Route path="appointments" element={<AppointmentsPlaceholder />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
