import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../Config/Supabase";

export default function UserComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  // Fetch complaints
  const fetchComplaints = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setComplaints(data || []);
  };

  useEffect(() => { fetchComplaints(); }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category)
      return Swal.fire("All fields are required!", "", "error");
    if (!user) return Swal.fire("User not found!", "", "error");

    setLoading(true);
    if (editId) {
      const { error } = await supabase.from("complaints").update(formData).eq("id", editId);
      if (error) return Swal.fire(error.message, "", "error");
      Swal.fire("Complaint updated!", "", "success");
      setEditId(null);
    } else {
      const { error } = await supabase.from("complaints").insert([
        { ...formData, user_id: user.id, status: "Submitted", created_at: new Date() },
      ]);
      if (error) return Swal.fire(error.message, "", "error");
      Swal.fire("Complaint submitted!", "", "success");
    }

    setFormData({ title: "", description: "", category: "" });
    setLoading(false);
    fetchComplaints();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) return Swal.fire(error.message, "", "error");
    fetchComplaints();
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setFormData({ title: c.title, description: c.description, category: c.category });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#0057a8]">My Complaints</h1>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">{editId ? "Edit Complaint" : "Submit a Complaint"}</h2>

        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Title" className="w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#66b032]" />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" rows={4} className="w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#66b032]" />
        <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="Category (Internet, Electricity, etc.)" className="w-full mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-[#66b032]" />

        <button onClick={handleSubmit} disabled={loading} className="bg-[#66b032] text-white py-2 px-4 rounded hover:bg-[#5aa12b] transition">
          {loading ? (editId ? "Updating..." : "Submitting...") : editId ? "Update Complaint" : "Submit Complaint"}
        </button>
      </div>

      {/* Complaints List */}
      <div>
        {complaints.length === 0 ? (
          <p className="text-gray-500">No complaints submitted yet.</p>
        ) : (
          complaints.map((c) => (
            <div key={c.id} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <p className="text-gray-700">{c.description}</p>
                <p className="text-sm text-gray-500">Category: {c.category} | Status: <span className={c.status === "Resolved" ? "text-green-600" : c.status === "In Progress" ? "text-yellow-500" : "text-gray-500"}>{c.status}</span></p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleEdit(c)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
