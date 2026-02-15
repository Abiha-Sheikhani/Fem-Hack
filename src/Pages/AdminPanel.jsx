import { useState, useEffect } from "react";
import AdminSidebar from "../Components/admin/AdminSidebar";
import AdminComplaints from "../components/Admin/AdminComplaints";
import AdminLostFound from "../components/Admin/AdminLostFound";
import AdminVolunteers from "../Components/admin/AdminVolunteer";
import AdminUsers from "../Components/admin/AdminUsers";
import { supabase } from "../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminDashboard() {
  const [active, setActive] = useState("complaints");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // Fetch current user and role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        // No user logged in
        window.location.href = "/";
        return;
      }

      // Check role from your "users" table
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("uid", authData.user.id)
        .single();

      if (error || !data) {
        Swal.fire("Access denied", "You are not authorized.", "error");
        window.location.href = "/";
        return;
      }

      if (data.role !== "admin") {
        Swal.fire("Access denied", "You must be an admin to access this page.", "error");
        window.location.href = "/";
        return;
      }

      setUserRole(data.role);
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar setActive={setActive} logout={logout} />
      <div className="flex-1 p-6 bg-gray-100">
        {renderPage()}
      </div>
    </div>
  );
}
