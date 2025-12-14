import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { initToastHandler } from './utils/errorHandler';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Timer } from './pages/Timer';
import { Projects } from './pages/Projects';
import { Statistics } from './pages/Statistics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Initialize toast handler bridge
const ToastInitializer = () => {
  const toast = useToast();
  useEffect(() => {
    initToastHandler(toast);
  }, [toast]);
  return null;
};

// Wrapper component to access auth state
const AppContent = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter basename="/">
      <ToastInitializer />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {user && <Navigation />}
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/timer"
              element={
                <ProtectedRoute>
                  <Timer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <Statistics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
