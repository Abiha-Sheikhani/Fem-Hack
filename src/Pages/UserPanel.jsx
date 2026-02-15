import Sidebar from "../Components/user/UserSidebar";
import UserComplaints from "../Components/user/UserComplaints";
import LostFound from "../Components/user/UserLostFound";
import Volunteers from "../Components/user/UserVolunteer";
import Notifications from "../Components/user/Notifications";
import { useState } from "react";
import { supabase } from "../Config/Supabase.js";

export default function UserDashboard() {
  const [active, setActive] = useState("complaints");

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const renderPage = () => {
    switch(active){
      case "complaints": return <UserComplaints/>;
      case "lost-found": return <LostFound />;
      case "volunteers": return <Volunteers />;
      case "notifications": return <Notifications />;
      default: return <Complaints />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar setActive={setActive} logout={logout} />
      <div className="flex-1 p-6 bg-gray-100">
        {renderPage()}
      </div>
    </div>
  );
}
