import { useState } from "react";
import Chat from "./pages/Chat";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NotFound from "./pages/NotFound";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <div>
    <Routes>
      <Route path="/" element={<Chat/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/signup" element={<Signup/>} />
      <Route path="*" element={<NotFound isDark={window.matchMedia("(prefers-color-scheme: dark)") ? window.matchMedia("(prefers-color-scheme: dark)").matches: false}/>} />
    </Routes>
    </div>
  );
}

export default App;
