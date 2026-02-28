import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

const SAYLANI_CAMPUSES = [
  "Main Campus - Korangi",
  "North Nazimabad",
  "Gulshan",
  "Malir",
  "FB Area",
  "Saddar",
  "Landhi",
  "Orangi Town",
  "Shah Faisal",
  "Surjani Town"
];

export default function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState([]);
  const [editVolunteer, setEditVolunteer] = useState(null);
  const [form, setForm] = useState({ 
    full_name: "",
    roll_no: "",
    campus: "",
    event: "", 
    availability: "",
    hours_available: "",
    status: ""
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [viewingVolunteer, setViewingVolunteer] = useState(null);

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
    setForm({ 
      full_name: vol.full_name,
      roll_no: vol.roll_no,
      campus: vol.campus,
      event: vol.event, 
      availability: vol.availability,
      hours_available: vol.hours_available,
      status: vol.status
    });
  };

  const saveEdit = async () => {
    if (!form.full_name || !form.roll_no || !form.campus || !form.event || !form.availability || !form.hours_available || !form.status) {
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
      v.event?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.availability?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.campus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      activeTab === "all" ||
      v.status?.toLowerCase() === activeTab.toLowerCase();
    
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status) => {
    const badges = {
      "Approved": isDark ? "bg-green-900/30 text-green-400 border-green-500/30" : "bg-green-100 text-green-800 border-green-200",
      "Pending": isDark ? "bg-yellow-900/30 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Rejected": isDark ? "bg-red-900/30 text-red-400 border-red-500/30" : "bg-red-100 text-red-800 border-red-200"
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
      <div className={`rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border group ${
        isDark 
          ? 'bg-white/5 border-white/10 hover:border-indigo-500/50 backdrop-blur-xl' 
          : 'bg-white border-gray-100 hover:border-indigo-200'
      }`}>
        {/* Profile Header */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600">
          <div className="absolute -bottom-12 left-6">
            <img 
              src={v.profile_image || 'https://via.placeholder.com/150'} 
              alt={v.full_name}
              className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setViewingVolunteer(v)}
            />
          </div>
          <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(v.status)}`}>
            {getStatusIcon(v.status)} {v.status}
          </span>
        </div>

        <div className="p-6 pt-16">
          {/* Name & Roll No */}
          <h3 className={`font-bold text-xl mb-1 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {v.full_name}
          </h3>
          <p className={`text-sm mb-3 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Roll No: {v.roll_no}
          </p>

          {/* Campus Badge */}
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
            isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-800'
          }`}>
            📍 {v.campus}
          </div>

          {/* User Info */}
          <div className={`rounded-lg p-3 mb-3 ${
            isDark ? 'bg-white/5' : 'bg-gradient-to-r from-indigo-50 to-purple-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{user?.username || "Unknown"}</p>
                <p className={`text-xs truncate transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>{user?.email || "No email"}</p>
              </div>
            </div>
          </div>

          {/* Event */}
          <div className={`rounded-lg p-3 mb-3 ${
            isDark ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎯</span>
              <p className={`text-xs font-medium transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>Event</p>
            </div>
            <p className={`text-sm font-medium transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-gray-700'
            }`}>{v.event}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className={`rounded-lg p-2 ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm">📅</span>
                <p className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Availability</p>
              </div>
              <p className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}>{v.availability}</p>
            </div>

            <div className={`rounded-lg p-2 ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm">⏰</span>
                <p className={`text-xs font-medium transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>Hours</p>
              </div>
              <p className={`text-xs transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}>{v.hours_available}hrs</p>
            </div>
          </div>

          {/* Date */}
          <div className={`flex items-center gap-2 text-xs mb-4 pb-4 border-b transition-colors duration-300 ${
            isDark ? 'text-gray-500 border-white/10' : 'text-gray-500 border-gray-100'
          }`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(v.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewingVolunteer(v)}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              👁️ View
            </button>
            <button
              onClick={() => openEditModal(v)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => deleteVolunteer(v.id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-6 right-6 z-50 p-3 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-110 group ${
          isDark 
            ? 'bg-white/10 hover:bg-white/20 border border-white/20' 
            : 'bg-white/80 hover:bg-white border border-gray-200'
        }`}
      >
        {isDark ? (
          <svg className="w-6 h-6 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            🤝 Volunteer Management
          </h1>
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>Review and manage volunteer applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", count: statusCounts.all, icon: "👥", color: "indigo", gradient: "from-indigo-500 to-purple-600" },
            { label: "Pending", count: statusCounts.pending, icon: "⏳", color: "yellow", gradient: "from-yellow-500 to-orange-500" },
            { label: "Approved", count: statusCounts.approved, icon: "✅", color: "green", gradient: "from-green-500 to-emerald-600" },
            { label: "Rejected", count: statusCounts.rejected, icon: "❌", color: "red", gradient: "from-red-500 to-pink-600" }
          ].map((stat, idx) => (
            <div key={idx} className={`rounded-xl shadow-lg p-6 border transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-white/5 border-white/10 backdrop-blur-xl' 
                : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{stat.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${stat.gradient}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className={`rounded-xl shadow-md p-4 mb-6 transition-all duration-300 ${
          isDark ? 'bg-white/5 backdrop-blur-xl' : 'bg-white'
        }`}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, roll no, campus, event, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <svg className={`w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
              isDark ? 'text-gray-500' : 'text-gray-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-xl shadow-md mb-6 overflow-x-auto transition-all duration-300 ${
          isDark ? 'bg-white/5 backdrop-blur-xl' : 'bg-white'
        }`}>
          <div className={`flex border-b min-w-max transition-colors duration-300 ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
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
                    ? isDark 
                      ? 'text-indigo-400 bg-white/5' 
                      : 'text-indigo-600 bg-indigo-50'
                    : isDark 
                      ? 'text-gray-400 hover:bg-white/5' 
                      : 'text-gray-600 hover:bg-gray-50'
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
            <div className={`col-span-full rounded-xl shadow-md p-12 text-center transition-all duration-300 ${
              isDark ? 'bg-white/5 backdrop-blur-xl' : 'bg-white'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <span className="text-4xl">🔍</span>
              </div>
              <p className={`text-lg transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
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

      {/* View Details Modal */}
      {viewingVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setViewingVolunteer(null)}>
          <div className={`rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  👁️ Volunteer Details
                </h2>
                <button 
                  onClick={() => setViewingVolunteer(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={viewingVolunteer.profile_image || 'https://via.placeholder.com/150'} 
                  alt={viewingVolunteer.full_name}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-indigo-500 shadow-lg"
                />
                <div>
                  <h3 className={`text-2xl font-bold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{viewingVolunteer.full_name}</h3>
                  <p className={`transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>Roll No: {viewingVolunteer.roll_no}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mt-2 ${getStatusBadge(viewingVolunteer.status)}`}>
                    {getStatusIcon(viewingVolunteer.status)} {viewingVolunteer.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>📍 Campus</p>
                  <p className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{viewingVolunteer.campus}</p>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>⏰ Hours Available</p>
                  <p className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{viewingVolunteer.hours_available} hours</p>
                </div>

                <div className={`p-4 rounded-lg col-span-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>🎯 Event</p>
                  <p className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{viewingVolunteer.event}</p>
                </div>

                <div className={`p-4 rounded-lg col-span-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>📅 Availability</p>
                  <p className={`font-semibold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{viewingVolunteer.availability}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setEditVolunteer(null)}>
          <div className={`rounded-2xl w-full max-w-md shadow-2xl transform transition-all ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ✏️ Edit Volunteer
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Roll Number</label>
                  <input
                    type="text"
                    value={form.roll_no}
                    onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>Hours</label>
                  <input
                    type="number"
                    value={form.hours_available}
                    onChange={(e) => setForm({ ...form, hours_available: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Campus</label>
                <select
                  value={form.campus}
                  onChange={(e) => setForm({ ...form, campus: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {SAYLANI_CAMPUSES.map(campus => (
                    <option key={campus} value={campus}>{campus}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Event Name</label>
                <input
                  type="text"
                  value={form.event}
                  onChange={(e) => setForm({ ...form, event: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Availability</label>
                <input
                  type="text"
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="Approved">✅ Approved</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 rounded-b-2xl flex gap-3 ${
              isDark ? 'bg-white/5' : 'bg-gray-50'
            }`}>
              <button 
                onClick={() => setEditVolunteer(null)} 
                className={`flex-1 px-4 py-3 border-2 rounded-lg transition-all font-semibold ${
                  isDark
                    ? 'border-white/20 text-gray-300 hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-md hover:shadow-lg"
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