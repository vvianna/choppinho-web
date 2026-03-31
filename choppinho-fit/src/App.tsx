import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AuthVerify from "./pages/AuthVerify";
import Dashboard from "./pages/dashboard/Index";
import Settings from "./pages/dashboard/Settings";
import Training from "./pages/dashboard/Training";
import TrainingForm from "./pages/dashboard/TrainingForm";
import PlanView from "./pages/dashboard/PlanView";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/verify" element={<AuthVerify />} />
        <Route path="/auth" element={<AuthVerify />} /> {/* Magic link curto */}

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/races"
          element={<Navigate to="/dashboard/treino" replace />}
        />
        <Route path="/dashboard/treino" element={<ProtectedRoute><Training /></ProtectedRoute>} />
        <Route path="/dashboard/treino/novo/:raceId?" element={<ProtectedRoute><TrainingForm /></ProtectedRoute>} />
        <Route path="/dashboard/treino/plano/:planId" element={<ProtectedRoute><PlanView /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
