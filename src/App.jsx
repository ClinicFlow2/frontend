// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import PatientVisits from "./pages/PatientVisits";
import VisitDetail from "./pages/VisitDetail";
import Visits from "./pages/Visits";
import Prescriptions from "./pages/Prescriptions";
import Appointments from "./pages/Appointments";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Patients */}
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/patients/:id/visits" element={<PatientVisits />} />
        <Route path="/patients/:id/visits/:visitId" element={<VisitDetail />} />

        {/* Visits */}
        <Route path="/visits" element={<Visits />} />

        {/* Prescriptions */}
        <Route path="/prescriptions" element={<Prescriptions />} />

        {/* Appointments */}
        <Route path="/appointments" element={<Appointments />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
