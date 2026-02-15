import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function Volunteers() {
  const [vols, setVols] = useState([]);
  const [form, setForm] = useState({ event: "", availability: "" });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => {
    fetchData();

    // Realtime subscription
    if (userId) {
      const channel = supabase
        .channel("user-volunteers")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "volunteers",
            filter: `user_id=eq.${userId}`
          },
          fetchData
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [userId]);

  const submitVolunteer = async () => {
    if (!form.event || !form.availability)
      return Swal.fire("Missing Fields", "Please fill all fields!", "error");

    setLoading(true);

    if (editId) {
      // Edit existing
      const { error } = await supabase
        .from("volunteers")
        .update({ ...form })
        .eq("id", editId);
      if (error) {
        setLoading(false);
        return Swal.fire("Error", error.message, "error");
      }
      setEditId(null);
      Swal.fire("Success!", "Volunteer registration updated!", "success");
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
      if (error) {
        setLoading(false);
        return Swal.fire("Error", error.message, "error");
      }
      Swal.fire("Success!", "Registered as volunteer successfully!", "success");
    }

    setForm({ event: "", availability: "" });
    setShowForm(false);
    setLoading(false);
    fetchData();
  };

  const editVolunteer = (vol) => {
    setEditId(vol.id);
    setForm({ event: vol.event, availability: vol.availability });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteVolunteer = async (id) => {
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
      const { error } = await supabase.from("volunteers").delete().eq("id", id);
      if (error) return Swal.fire("Error", error.message, "error");
      Swal.fire("Deleted!", "Volunteer registration has been removed.", "success");
      fetchData();
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ event: "", availability: "" });
    setShowForm(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      "Approved": "bg-green-100 text-green-800 border-green-200",
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Rejected": "bg-red-100 text-red-800 border-red-200"
    };
    return badges[status] || badges["Pending"];
  };

  const getStatusIcon = (status) => {
    const icons = {
      "Approved": "✅",
      "Pending": "⏳",
      "Rejected": "❌"
    };
    return icons[status] || "⏳";
  };

  const statusCounts = {
    total: vols.length,
    pending: vols.filter(v => v.status === "Pending").length,
    approved: vols.filter(v => v.status === "Approved").length,
    rejected: vols.filter(v => v.status === "Rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🤝 Volunteer Registration
          </h1>
          <p className="text-gray-600">Register for volunteer opportunities and track your applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>
        </div>

        {/* Register Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            ➕ Register as Volunteer
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl mb-8 border-2 border-green-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {editId ? "✏️ Edit Registration" : "➕ Register as Volunteer"}
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
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Community Cleanup, Food Drive, etc."
                  value={form.event}
                  onChange={(e) => setForm({ ...form, event: e.target.value })}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Availability <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Weekends, Mon-Fri evenings, Full-time"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Pro Tip</p>
                    <p className="text-sm text-blue-700">
                      Be specific about your availability to help organizers match you with suitable opportunities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitVolunteer}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {editId ? "Updating..." : "Registering..."}
                    </span>
                  ) : (
                    editId ? "💾 Update Registration" : "📤 Submit Registration"
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

        {/* Volunteers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vols.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🤝</span>
              </div>
              <p className="text-gray-500 text-lg mb-4">No volunteer registrations yet</p>
              <p className="text-gray-400 text-sm">Click the button above to register for your first volunteer opportunity</p>
            </div>
          ) : (
            vols.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-200 group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎯</span>
                        <h3 className="font-bold text-xl text-gray-900 line-clamp-2">
                          {v.event}
                        </h3>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(v.status)}`}>
                        {getStatusIcon(v.status)} {v.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">📅</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">Availability</p>
                        <p className="text-sm text-gray-700 font-medium">{v.availability}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(v.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => editVolunteer(v)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteVolunteer(v.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            🌟 Why Volunteer?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-xl">💪</span>
              <div>
                <p className="font-semibold mb-1">Make a Difference</p>
                <p className="text-green-100">Contribute to meaningful causes and help your community</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">🤝</span>
              <div>
                <p className="font-semibold mb-1">Build Connections</p>
                <p className="text-green-100">Meet like-minded people and expand your network</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">📈</span>
              <div>
                <p className="font-semibold mb-1">Gain Experience</p>
                <p className="text-green-100">Develop new skills and enhance your resume</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}