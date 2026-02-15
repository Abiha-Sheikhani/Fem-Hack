import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    complaints: 0,
    lostItems: 0,
    volunteers: 0,
    users: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: complaints } = await supabase
      .from("complaints")
      .select("*", { count: "exact", head: true });

    const { count: lostItems } = await supabase
      .from("lost_found_items")
      .select("*", { count: "exact", head: true });

    const { count: volunteers } = await supabase
      .from("volunteers")
      .select("*", { count: "exact", head: true });

    const { count: users } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    setStats({ complaints, lostItems, volunteers, users });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Total Complaints" value={stats.complaints} />
        <Card title="Lost & Found Posts" value={stats.lostItems} />
        <Card title="Volunteers" value={stats.volunteers} />
        <Card title="Total Users" value={stats.users} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
