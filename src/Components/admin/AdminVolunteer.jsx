import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";

export default function AdminVolunteer() {
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    const { data } = await supabase
      .from("volunteers")
      .select("*")
      .order("created_at", { ascending: false });

    setVolunteers(data);
  };

  const updateStatus = async (id, status) => {
    await supabase
      .from("volunteers")
      .update({ status })
      .eq("id", id);

    fetchVolunteers();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Volunteers</h2>

      {volunteers.map((v) => (
        <div key={v.id} className="bg-white p-4 rounded shadow mb-3">
          <p className="font-semibold">{v.event_name}</p>
          <p className="text-sm mb-3">Status: {v.status}</p>

          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(v.id, "approved")}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Approve
            </button>

            <button
              onClick={() => updateStatus(v.id, "rejected")}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
