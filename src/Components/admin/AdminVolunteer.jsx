import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState([]);
  const [editVolunteer, setEditVolunteer] = useState(null);
  const [form, setForm] = useState({ event: "", availability: "", status: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

    // Realtime subscription
    const channel = supabase
      .channel("realtime-volunteers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "volunteers" },
        fetchVols
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

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
      if (error) return Swal.fire(error.message, "", "error");
      Swal.fire('Deleted!', 'Volunteer has been removed.', 'success');
      fetchVols();
    }
  };

  const openEditModal = (vol) => {
    setEditVolunteer(vol);
    setForm({ event: vol.event, availability: vol.availability, status: vol.status });
  };

  const saveEdit = async () => {
    if (!form.event || !form.availability || !form.status) {
      return Swal.fire('Missing Fields', 'Please fill in all fields', 'warning');
    }

    const { error } = await supabase
      .from("volunteers")
      .update({ ...form })
      .eq("id", editVolunteer.id);
    
    if (error) return Swal.fire(error.message, "", "error");
    
    // Send notification to user
    const user = users.find((u) => u.uid === editVolunteer.user_id);
    if (user) {
      await supabase.from("notifications").insert({
        user_id: editVolunteer.user_id,
        message: `Your volunteer application for "${form.event}" has been ${form.status.toLowerCase()}`,
      });
    }

    Swal.fire('Updated!', 'Volunteer information has been updated.', 'success');
    setEditVolunteer(null);
    fetchVols();
  };

  // Filter volunteers
  const filteredVolunteers = volunteers.filter((v) => {
    const user = users.find((u) => u.uid === v.user_id);
    const matchesSearch = 
      v.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.availability.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      v.status.toLowerCase() === activeTab.toLowerCase();
    
    return matchesSearch && matchesTab;
  });

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
    return icons[status] || "📋";
  };

  const statusCounts = {
    all: volunteers.length,
    pending: volunteers.filter(v => v.status === "Pending").length,
    approved: volunteers.filter(v => v.status === "Approved").length,
    rejected: volunteers.filter(v => v.status === "Rejected").length,
  };

  // Card Component
  const VolunteerCard = ({ v }) => {
    const user = users.find((u) => u.uid === v.user_id);
    
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 group">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-xl text-gray-900 line-clamp-1">
                  {v.event}
                </h3>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(v.status)}`}>
                {getStatusIcon(v.status)} {v.status}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{user?.username || "Unknown User"}</p>
                <p className="text-sm text-gray-600 truncate">{user?.email || "No email"}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">📅</span>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Availability</p>
                <p className="text-sm text-gray-700">{v.availability}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={() => openEditModal(v)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => deleteVolunteer(v.id)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🤝 Volunteer Management
          </h1>
          <p className="text-gray-600">Review and manage volunteer applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.all}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
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
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statusCounts.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
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

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by event, availability, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {[
              { key: "all", label: "All", icon: "📋", count: statusCounts.all },
              { key: "pending", label: "Pending", icon: "⏳", count: statusCounts.pending },
              { key: "approved", label: "Approved", icon: "✅", count: statusCounts.approved },
              { key: "rejected", label: "Rejected", icon: "❌", count: statusCounts.rejected },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 font-semibold transition-all relative whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab.icon} {tab.label} ({tab.count})
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Volunteers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVolunteers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-gray-500 text-lg">
                {searchTerm 
                  ? "No volunteers match your search" 
                  : `No ${activeTab === "all" ? "" : activeTab} volunteers`}
              </p>
            </div>
          ) : (
            filteredVolunteers.map((v) => <VolunteerCard key={v.id} v={v} />)
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ✏️ Edit Volunteer
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={form.event}
                  onChange={(e) => setForm({ ...form, event: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Availability
                </label>
                <input
                  type="text"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="e.g., Weekends, Mon-Fri evenings"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="Approved">✅ Approved</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
              <button 
                onClick={() => setEditVolunteer(null)} 
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
