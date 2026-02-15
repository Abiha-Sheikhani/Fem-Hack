import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState([]);
  const [editVolunteer, setEditVolunteer] = useState(null);
  const [form, setForm] = useState({ event: "", availability: "", status: "" });

  // Fetch volunteers
  const fetchVols = async () => {
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setVolunteers(data || []);
  };

  // Fetch users
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("uid, username, email");
    if (!error) setUsers(data || []);
  };

  useEffect(() => {
    fetchVols();
    fetchUsers();
  }, []);

  const deleteVolunteer = async (id) => {
    const { error } = await supabase.from("volunteers").delete().eq("id", id);
    if (error) return Swal.fire(error.message, "", "error");
    fetchVols();
  };

  const openEditModal = (vol) => {
    setEditVolunteer(vol);
    setForm({ event: vol.event, availability: vol.availability, status: vol.status });
  };

  const saveEdit = async () => {
    const { error } = await supabase
      .from("volunteers")
      .update({ ...form })
      .eq("id", editVolunteer.id);
    if (error) return Swal.fire(error.message, "", "error");
    setEditVolunteer(null);
    fetchVols();
  };

  return (
    <div className="p-6 flex-1 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#0057a8] mb-6">All Volunteers</h1>

      {volunteers.length === 0 && <p className="text-gray-500">No volunteers yet.</p>}

      <div className="space-y-4">
        {volunteers.map((v) => {
          const user = users.find((u) => u.uid === v.user_id);
          return (
            <div key={v.id} className="bg-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
              <div>
                <h3 className="font-bold text-xl mb-1">Event: {v.event}</h3>
                <p className="text-gray-700 mb-1">Availability: {v.availability}</p>
                <p className="text-gray-500 mb-1">Status: {v.status}</p>
                <p className="text-gray-500 mb-1">User: {user?.username || "Unknown"}</p>
                <p className="text-xs text-gray-400">Registered: {new Date(v.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-col space-y-2 mt-3 md:mt-0">
                <button
                  onClick={() => openEditModal(v)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-semibold"
                >
                  Approve/Edit
                </button>
                <button
                  onClick={() => deleteVolunteer(v.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Volunteer</h2>
            <input
              type="text"
              value={form.event}
              onChange={(e) => setForm({ ...form, event: e.target.value })}
              className="border p-2 rounded w-full mb-3"
              placeholder="Event Name"
            />
            <input
              type="text"
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
              className="border p-2 rounded w-full mb-3"
              placeholder="Availability"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="border p-2 rounded w-full mb-3"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setEditVolunteer(null)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
