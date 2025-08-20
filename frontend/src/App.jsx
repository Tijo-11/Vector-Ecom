import { useState } from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./views/auth/login";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Welcome</h1>} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
