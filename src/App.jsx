import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthCard from "./Pages/Auth";
import UserDashboard from "./Pages/UserPanel";
import AdminDashboard from "./Pages/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthCard />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
