import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Chat from "./pages/Chat";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)")
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login isDark={isDark} />} />
        <Route path="/login" element={<Login isDark={isDark} />} />
        <Route path="/signup" element={<Signup isDark={isDark}/>} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat theme={isDark} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound isDark={isDark} />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
