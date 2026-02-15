import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    setComplaints(data);
  };

  const updateStatus = async (id, status) => {
    await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    fetchComplaints();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Complaints</h2>

      {complaints.map((c) => (
        <div key={c.id} className="bg-white p-4 rounded shadow mb-3">
          <p className="mb-2">{c.description}</p>
          <p className="text-sm mb-3">Status: {c.status}</p>

          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(c.id, "in_progress")}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              In Progress
            </button>

            <button
              onClick={() => updateStatus(c.id, "resolved")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
