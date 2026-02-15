import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);

  // Fetch complaints
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return Swal.fire(error.message, "", "error");
    setComplaints(data || []);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("realtime-complaints")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        fetchData
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, status) => {
    await supabase.from("complaints").update({ status }).eq("id", id);

    const complaint = complaints.find((c) => c.id === id);
    if (complaint) {
      await supabase.from("notifications").insert({
        user_id: complaint.user_id,
        message: `Your complaint "${complaint.title}" is now ${status}`,
      });
    }
    fetchData();
  };

  const deleteComplaint = async (id) => {
    await supabase.from("complaints").delete().eq("id", id);
    fetchData();
  };

  const pending = complaints.filter((c) => c.status !== "Resolved");
  const resolved = complaints.filter((c) => c.status === "Resolved");

  const Card = ({ c }) => (
    <div className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transition relative flex flex-col md:flex-row md:justify-between items-start md:items-center">
      <div className="flex-1 mb-3 md:mb-0">
        <h3 className="font-bold text-xl mb-1">{c.title}</h3>
        <p className="text-gray-700 mb-1">{c.description}</p>
        <p className="text-sm text-gray-500">
          Category: {c.category} | Status:{" "}
          <span
            className={
              c.status === "Resolved"
                ? "text-green-600"
                : c.status === "In Progress"
                ? "text-yellow-500"
                : "text-gray-500"
            }
          >
            {c.status || "Submitted"}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Submitted: {new Date(c.created_at).toLocaleString()}
        </p>
      </div>

      <div className="flex space-x-2">
        {c.status !== "Resolved" && (
          <>
            <button
              onClick={() => updateStatus(c.id, "In Progress")}
              className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500 transition font-semibold"
            >
              In Progress
            </button>
            <button
              onClick={() => updateStatus(c.id, "Resolved")}
              className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 text-white font-semibold"
            >
              Resolve
            </button>
          </>
        )}
        <button
          onClick={() => deleteComplaint(c.id)}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 text-white font-semibold"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-[#0057a8]">All Complaints</h1>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Pending</h2>
        {pending.length === 0 && <p className="text-gray-500">No pending complaints</p>}
        <div className="space-y-4">{pending.map((c) => <Card key={c.id} c={c} />)}</div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Resolved</h2>
        {resolved.length === 0 && <p className="text-gray-500">No resolved complaints</p>}
        <div className="space-y-4">{resolved.map((c) => <Card key={c.id} c={c} />)}</div>
      </div>
    </div>
  );
}
