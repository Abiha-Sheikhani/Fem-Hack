import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function Volunteers() {
  const [vols, setVols] = useState([]);
  const [form, setForm] = useState({ event: "", availability: "" });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  // Fetch only this user's volunteers
  const fetchData = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setVols(data || []);
  };

  useEffect(() => { fetchData(); }, [userId]);

  const submitVolunteer = async () => {
    if (!form.event || !form.availability)
      return Swal.fire("Please fill all fields!", "", "error");

    setLoading(true);

    if (editId) {
      // Edit existing
      const { error } = await supabase
        .from("volunteers")
        .update({ ...form })
        .eq("id", editId);
      if (error) return Swal.fire(error.message, "", "error");
      setEditId(null);
      Swal.fire("Updated successfully!", "", "success");
    } else {
      // Add new
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("volunteers").insert([
        {
          user_id: user.user.id,
          ...form,
          status: "Pending",
          created_at: new Date(),
        },
      ]);
      if (error) return Swal.fire(error.message, "", "error");
      Swal.fire("Registered successfully!", "", "success");
    }

    setForm({ event: "", availability: "" });
    setLoading(false);
    fetchData();
  };

  const editVolunteer = (vol) => {
    setEditId(vol.id);
    setForm({ event: vol.event, availability: vol.availability });
  };

  const deleteVolunteer = async (id) => {
    const { error } = await supabase.from("volunteers").delete().eq("id", id);
    if (error) return Swal.fire(error.message, "", "error");
    fetchData();
  };

  return (
    <div className="p-6 flex-1">
      <h1 className="text-3xl font-bold text-[#0057a8] mb-6">Volunteer Registration</h1>

      {/* Form */}
      <div className="bg-white shadow-md p-6 rounded-lg mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Event Name"
          value={form.event}
          onChange={(e) => setForm({ ...form, event: e.target.value })}
          className="border p-3 rounded flex-1 min-w-[150px]"
        />
        <input
          type="text"
          placeholder="Availability"
          value={form.availability}
          onChange={(e) => setForm({ ...form, availability: e.target.value })}
          className="border p-3 rounded flex-1 min-w-[150px]"
        />
        <button
          onClick={submitVolunteer}
          disabled={loading}
          className="bg-[#66b032] text-white px-6 py-2 rounded hover:bg-[#5aa12b] transition font-semibold"
        >
          {loading ? (editId ? "Updating..." : "Adding...") : editId ? "Update" : "Register"}
        </button>
      </div>

      {/* Volunteers List */}
      <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
        {vols.length === 0 && <p className="text-gray-500">No volunteers yet.</p>}

        {vols.map((v) => (
          <div key={v.id} className="bg-white shadow rounded-lg p-4 flex flex-col">
            <h3 className="font-bold text-lg mb-1">Event: {v.event}</h3>
            <p className="text-gray-700 mb-1">Availability: {v.availability}</p>
            <p className="text-gray-500 text-sm">Status: {v.status}</p>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => editVolunteer(v)}
                className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => deleteVolunteer(v.id)}
                className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
