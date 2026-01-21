import { useState } from "react";
import { Routes,Route } from "react-router-dom";
import Chat from "./pages/Chat";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";


function App() {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/" element={<Login/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/chat" element={
                              <ProtectedRoute>
                                <Chat/>
                              </ProtectedRoute>}/>
          <Route path="*" element={<NotFound isDark={window.matchMedia("(prefers-color-scheme: dark)") ? window.matchMedia("(prefers-color-scheme: dark)").matches: false}/>} />
        </Routes>
    </AuthProvider>
  );
}

export default App;
