import { useState } from "react";
import AdminSidebar from "../components/Admin/AdminSidebar";
import AdminComplaints from "../components/Admin/AdminComplaints";
import AdminLostFound from "../components/Admin/AdminLostFound";
import AdminVolunteers from "../components/Admin/AdminVolunteers";
import AdminUsers from "../components/Admin/AdminUsers";
import { supabase } from "../Config/Supabase";

export default function AdminDashboard() {
  const [active, setActive] = useState("complaints");

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const renderPage = () => {
    switch (active) {
      case "complaints": return <AdminComplaints />;
      case "lost-found": return <AdminLostFound />;
      case "volunteers": return <AdminVolunteers />;
      case "users": return <AdminUsers />;
      default: return <AdminComplaints />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar setActive={setActive} logout={logout} />
      <div className="flex-1 p-6 bg-gray-100">
        {renderPage()}
      </div>
    </div>
  );
}
