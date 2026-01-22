import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
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
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                key={location.pathname} // Key changes with route, triggering AnimatePresence
                // 1. Initial State: Positioned above the viewport
                initial={{ y: -200, opacity: 0 }}
                // 2. Animate State: Move to original position
                animate={{ y: 0, opacity: 1 }}
                // 3. Transition: Smooth out the movement
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                  duration: 0.5,
                }} // Animation timing
              >
                <Login isDark={isDark} />
              </motion.div>
            }
          />
          <Route
            path="/login"
            element={
              <motion.div
                key={location.pathname} // Key changes with route, triggering AnimatePresence
                // 1. Initial State: Positioned above the viewport
                initial={{ y: -200, opacity: 0 }}
                // 2. Animate State: Move to original position
                animate={{ y: 0, opacity: 1 }}
                // 3. Transition: Smooth out the movement
                transition={{
                  type: "tween",
                  stiffness: 10,
                  damping: 10,
                  duration: 1,
                }} // Animation timing// Animation timing
              >
                <Login isDark={isDark} />
              </motion.div>
            }
          />
          <Route
            path="/signup"
            element={
              <motion.div
                key={location.pathname} // Key changes with route, triggering AnimatePresence
                // 1. Initial State: Positioned above the viewport
                initial={{ y: -200, opacity: 0 }}
                // 2. Animate State: Move to original position
                animate={{ y: 0, opacity: 1 }}
                // 3. Transition: Smooth out the movement
                transition={{
                  type: "tween",
                  stiffness: 10,
                  damping: 10,
                  duration: 1,
                }} // Animation timing // Animation timing
              >
                <Signup isDark={isDark} />
              </motion.div>
            }
          />
          <Route
            path="/chat"
            element={
              <motion.div
                key={location.pathname} // Key changes with route, triggering AnimatePresence
                // 1. Initial State: Positioned above the viewport
                initial={{ y: -200, opacity: 0 }}
                // 2. Animate State: Move to original position
                animate={{ y: 0, opacity: 1 }}
                // 3. Transition: Smooth out the movement
                transition={{
                  type: "tween",
                  stiffness: 10,
                  damping: 10,
                  duration: 1,
                }} // Animation timing // Animation timing
              >
                <ProtectedRoute>
                  <Chat isDark={isDark} />
                </ProtectedRoute>
              </motion.div>
            }
          />
          <Route path="*" element={
            <motion.div
                key={location.pathname} // Key changes with route, triggering AnimatePresence
                // 1. Initial State: Positioned above the viewport
                initial={{ y: -200, opacity: 0 }}
                // 2. Animate State: Move to original position
                animate={{ y: 0, opacity: 1 }}
                // 3. Transition: Smooth out the movement
                transition={{
                  type: "tween",
                  stiffness: 10,
                  damping: 10,
                  duration: 1,
                }} // Animation timing // Animation timing
              >
                <NotFound isDark={isDark} />
              </motion.div>} />
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;
