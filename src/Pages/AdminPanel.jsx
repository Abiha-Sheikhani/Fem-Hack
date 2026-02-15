import { useState } from "react";
import AdminDashboard from "../components/admin/AdminDashboard";
import AdminLostFound from "../components/admin/AdminLostFound";
import AdminComplaints from "../components/admin/AdminComplaints";
import AdminVolunteer from "../components/admin/AdminVolunteer";

export default function AdminPanel() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-gray-100">

      <div className="w-64 bg-[#66b032] text-white p-6">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>

        <div className="space-y-3">
          <button onClick={() => setActive("dashboard")}>Dashboard</button>
          <button onClick={() => setActive("lost")}>Manage Lost</button>
          <button onClick={() => setActive("complaints")}>Manage Complaints</button>
          <button onClick={() => setActive("volunteer")}>Manage Volunteers</button>
        </div>
      </div>

      <div className="flex-1 p-8">
        {active === "dashboard" && <AdminDashboard />}
        {active === "lost" && <AdminLostFound />}
        {active === "complaints" && <AdminComplaints />}
        {active === "volunteer" && <AdminVolunteer />}
      </div>
    </div>
  );
}
