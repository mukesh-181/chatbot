
import { BrowserRouter,  Route, Routes } from "react-router-dom";
import ChatPage from "@/pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/customs/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
