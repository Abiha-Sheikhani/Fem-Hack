import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthCard from "./Pages/Auth";
import UserPanel from "./pages/UserPanel";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthCard />} />
        <Route path="/user" element={<UserPanel />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
