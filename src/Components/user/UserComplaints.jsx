import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../Config/Supabase";

export default function UserComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ title: "", description: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetchComplaints();

    // Realtime subscription
    if (user) {
      const channel = supabase
        .channel("user-complaints")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "complaints",
            filter: `user_id=eq.${user.id}`
          },
          fetchComplaints
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category)
      return Swal.fire("Missing Fields", "All fields are required!", "error");
    if (!user) return Swal.fire("Error", "User not found!", "error");

    setLoading(true);
    if (editId) {
      const { error } = await supabase.from("complaints").update(formData).eq("id", editId);
      if (error) {
        setLoading(false);
        return Swal.fire("Error", error.message, "error");
      }
      Swal.fire("Success!", "Complaint updated successfully!", "success");
      setEditId(null);
    } else {
      const { error } = await supabase.from("complaints").insert([
        { ...formData, user_id: user.id, status: "Submitted", created_at: new Date() },
      ]);
      if (error) {
        setLoading(false);
        return Swal.fire("Error", error.message, "error");
      }
      Swal.fire("Success!", "Complaint submitted successfully!", "success");
    }

    setFormData({ title: "", description: "", category: "" });
    setShowForm(false);
    setLoading(false);
    fetchComplaints();
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("complaints").delete().eq("id", id);
      if (error) return Swal.fire("Error", error.message, "error");
      Swal.fire("Deleted!", "Your complaint has been removed.", "success");
      fetchComplaints();
    }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setFormData({ title: c.title, description: c.description, category: c.category });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({ title: "", description: "", category: "" });
    setShowForm(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      "Resolved": "bg-green-100 text-green-800 border-green-200",
      "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Submitted": "bg-blue-100 text-blue-800 border-blue-200"
    };
    return badges[status] || badges["Submitted"];
  };

  const getStatusIcon = (status) => {
    const icons = {
      "Resolved": "✅",
      "In Progress": "🔄",
      "Submitted": "📋"
    };
    return icons[status] || "📋";
  };

  const statusCounts = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === "Submitted").length,
    inProgress: complaints.filter(c => c.status === "In Progress").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            📋 My Complaints
          </h1>
          <p className="text-gray-600">Track and manage your submitted complaints</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Submitted</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.submitted}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Resolved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* New Complaint Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            ➕ Submit New Complaint
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl mb-8 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {editId ? "✏️ Edit Complaint" : "➕ Submit New Complaint"}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief title for your complaint"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Select a category</option>
                  <option value="Internet">💻 Internet</option>
                  <option value="Electricity">⚡ Electricity</option>
                  <option value="Plumbing">🚰 Plumbing</option>
                  <option value="Maintenance">🔧 Maintenance</option>
                  <option value="Security">🔒 Security</option>
                  <option value="Cleanliness">🧹 Cleanliness</option>
                  <option value="Other">📝 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your complaint in detail..."
                  rows={5}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {editId ? "Updating..." : "Submitting..."}
                    </span>
                  ) : (
                    editId ? "💾 Update Complaint" : "📤 Submit Complaint"
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complaints List */}
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📋</span>
              </div>
              <p className="text-gray-500 text-lg mb-4">No complaints submitted yet</p>
              <p className="text-gray-400 text-sm">Click the button above to submit your first complaint</p>
            </div>
          ) : (
            complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl mt-1">📋</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                            {c.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(c.status)}`}>
                              {getStatusIcon(c.status)} {c.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              {c.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3 ml-11">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 ml-11">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md whitespace-nowrap"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}