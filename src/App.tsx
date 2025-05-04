import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatWindow />} />
        {/* later: <Route path="/admin" … /> */}
      </Routes>
    </BrowserRouter>
  );
}