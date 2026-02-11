import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import PageTransition from "./components/PageTransition";
import Chat from "./pages/Chat";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NotFound from "./pages/NotFound";

function App() {
  const location = useLocation();
  const isDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <PageTransition>
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <PublicRoute>
                  <Login isDark={isDark} />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login isDark={isDark} />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup isDark={isDark} />
                </PublicRoute>
              }
            />
            <Route
              path="/chat/"
              element={
                <ProtectedRoute>
                  <Chat isDark={isDark} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <ProtectedRoute>
                  <Chat isDark={isDark} />
                </ProtectedRoute>
              }
            />
            <Route path="/not-found" element={<NotFound isDark={isDark} />} />
            <Route path="*" element={<NotFound isDark={isDark} />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;
