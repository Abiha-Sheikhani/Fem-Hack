import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch complaints
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return Swal.fire(error.message, "", "error");
    setComplaints(data || []);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("realtime-complaints")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "complaints" },
        fetchData
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, status) => {
    const result = await Swal.fire({
      title: 'Update Status?',
      text: `Change status to ${status}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, update it!'
    });

    if (!result.isConfirmed) return;

    await supabase.from("complaints").update({ status }).eq("id", id);

    const complaint = complaints.find((c) => c.id === id);
    if (complaint) {
      await supabase.from("notifications").insert({
        user_id: complaint.user_id,
        message: `Your complaint "${complaint.title}" is now ${status}`,
      });
    }
    
    Swal.fire('Updated!', 'Status has been updated.', 'success');
    fetchData();
  };

  const deleteComplaint = async (id) => {
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
      await supabase.from("complaints").delete().eq("id", id);
      Swal.fire('Deleted!', 'Complaint has been deleted.', 'success');
      fetchData();
    }
  };

  const pending = complaints.filter((c) => c.status !== "Resolved");
  const resolved = complaints.filter((c) => c.status === "Resolved");

  const filteredComplaints = (list) => {
    return list.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const displayList = activeTab === "pending" ? filteredComplaints(pending) : filteredComplaints(resolved);

  const getStatusBadge = (status) => {
    const badges = {
      "Resolved": "bg-green-100 text-green-800 border-green-200",
      "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Submitted": "bg-blue-100 text-blue-800 border-blue-200"
    };
    return badges[status] || badges["Submitted"];
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "Technical": "💻",
      "Facility": "🏢",
      "Security": "🔒",
      "Other": "📝"
    };
    return icons[category] || "📋";
  };

  const Card = ({ c }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl mt-1 group-hover:scale-110 transition-transform">
              {getCategoryIcon(c.category)}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                {c.title}
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(c.status || "Submitted")}`}>
                  {c.status || "Submitted"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {c.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {c.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            {c.status !== "Resolved" && (
              <>
                <button
                  onClick={() => updateStatus(c.id, "In Progress")}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                  title="Mark as In Progress"
                >
                  🔄 Progress
                </button>
                <button
                  onClick={() => updateStatus(c.id, "Resolved")}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                  title="Mark as Resolved"
                >
                  ✓ Resolve
                </button>
              </>
            )}
            <button
              onClick={() => deleteComplaint(c.id)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
              title="Delete Complaint"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            📋 Complaints Management
          </h1>
          <p className="text-gray-600">Monitor and manage all user complaints</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{complaints.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pending.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Resolved</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{resolved.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search complaints by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === "pending"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                ⏳ Pending ({pending.length})
              </span>
              {activeTab === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === "resolved"
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                ✅ Resolved ({resolved.length})
              </span>
              {activeTab === "resolved" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {displayList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-gray-500 text-lg">
                {searchTerm ? "No complaints match your search" : `No ${activeTab} complaints`}
              </p>
            </div>
          ) : (
            displayList.map((c) => <Card key={c.id} c={c} />)
          )}
        </div>
      </div>
    </div>
  );
}