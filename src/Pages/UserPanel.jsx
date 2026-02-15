import { useState } from "react";
import UserDashboard from "../components/user/UserDashboard";
import UserLostFound from "../components/user/UserLostFound";
import UserComplaints from "../components/user/UserComplaints";
import UserVolunteer from "../components/user/UserVolunteer";

export default function UserPanel() {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-64 bg-[#0057a8] text-white p-6">
        <h2 className="text-xl font-bold mb-8">User Panel</h2>

        <div className="space-y-3">
          <button onClick={() => setActive("dashboard")} className="block w-full text-left">Dashboard</button>
          <button onClick={() => setActive("lost")} className="block w-full text-left">Lost & Found</button>
          <button onClick={() => setActive("complaints")} className="block w-full text-left">Complaints</button>
          <button onClick={() => setActive("volunteer")} className="block w-full text-left">Volunteer</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {active === "dashboard" && <UserDashboard />}
        {active === "lost" && <UserLostFound />}
        {active === "complaints" && <UserComplaints />}
        {active === "volunteer" && <UserVolunteer />}
      </div>
    </div>
  );
}
