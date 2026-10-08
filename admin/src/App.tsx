import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Photographers from "./pages/Photographers";
import Events from "./pages/Events";
import Reports from "./pages/Reports";
import Disputes from "./pages/Disputes";
import Users from "./pages/Users";
import AppConfigPage from "./pages/AppConfig";
import Vendors from "./pages/Vendors";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/photographers" element={<Photographers />} />
                <Route path="/events" element={<Events />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/disputes" element={<Disputes />} />
                <Route path="/users" element={<Users />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/config" element={<AppConfigPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}