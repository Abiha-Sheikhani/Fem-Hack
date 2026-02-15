import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", role: "" });

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }
    setUsers(data || []);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel("realtime-users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        fetchData
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the user and all their data!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete user!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        Swal.fire("Error", error.message, "error");
        return;
      }
      Swal.fire('Deleted!', 'User has been removed.', 'success');
      fetchData();
    }
  };

  const openEditModal = (user) => {
    setEditUser(user);
    setForm({ username: user.username, email: user.email, role: user.role });
  };

  const saveEdit = async () => {
    if (!form.username || !form.email || !form.role) {
      return Swal.fire('Missing Fields', 'Please fill in all fields', 'warning');
    }

    const { error } = await supabase
      .from("users")
      .update({ ...form })
      .eq("id", editUser.id);
    
    if (error) {
      Swal.fire("Error", error.message, "error");
      return;
    }

    Swal.fire('Updated!', 'User information has been updated.', 'success');
    setEditUser(null);
    fetchData();
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || u.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const badges = {
      "admin": "bg-purple-100 text-purple-800 border-purple-200",
      "user": "bg-blue-100 text-blue-800 border-blue-200",
      "moderator": "bg-green-100 text-green-800 border-green-200"
    };
    return badges[role?.toLowerCase()] || badges["user"];
  };

  const getRoleIcon = (role) => {
    const icons = {
      "admin": "👑",
      "user": "👤",
      "moderator": "⭐"
    };
    return icons[role?.toLowerCase()] || "👤";
  };

  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.role?.toLowerCase() === "admin").length,
    user: users.filter(u => u.role?.toLowerCase() === "user").length,
    moderator: users.filter(u => u.role?.toLowerCase() === "moderator").length,
  };

  // User Card Component
  const UserCard = ({ u }) => {
    const initial = u.username?.charAt(0).toUpperCase() || "?";
    const joinDate = new Date(u.created_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 group">
        <div className="p-6">
          {/* Header with Avatar */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                {initial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm">{getRoleIcon(u.role)}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl text-gray-900 mb-1 truncate">
                {u.username || "Unknown User"}
              </h3>
              <p className="text-sm text-gray-600 truncate mb-2">{u.email}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(u.role)}`}>
                {getRoleIcon(u.role)} {u.role || "User"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium w-20">User ID:</span>
              <span className="text-gray-700 font-mono text-xs truncate">{u.uid || u.id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium w-20">Joined:</span>
              <span className="text-gray-700">{joinDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(u)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => deleteUser(u.id)}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            👥 User Management
          </h1>
          <p className="text-gray-600">Manage and monitor all system users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{roleCounts.all}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{roleCounts.admin}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Moderators</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{roleCounts.moderator}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Regular Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{roleCounts.user}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by username, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">👑 Admin</option>
              <option value="moderator">⭐ Moderator</option>
              <option value="user">👤 User</option>
            </select>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-gray-500 text-lg">
                {searchTerm || filterRole !== "all" 
                  ? "No users match your filters" 
                  : "No users found"}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => <UserCard key={u.id} u={u} />)
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ✏️ Edit User
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="user">👤 User</option>
                  <option value="moderator">⭐ Moderator</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
              <button 
                onClick={() => setEditUser(null)} 
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