import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminLostFound() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch all lost & found items
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("lost_found_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return Swal.fire(error.message, "", "error");
    setItems(data || []);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("realtime-lostfound")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lost_found_items" },
        fetchData
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Update item status
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

    await supabase.from("lost_found_items").update({ status }).eq("id", id);

    const item = items.find((i) => i.id === id);
    if (item) {
      await supabase.from("notifications").insert({
        user_id: item.user_id,
        message: `Your ${item.type} item "${item.title}" is now ${status}`,
      });
    }

    Swal.fire('Updated!', 'Status has been updated.', 'success');
    fetchData();
  };

  // Delete item
  const deleteItem = async (id) => {
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
      await supabase.from("lost_found_items").delete().eq("id", id);
      Swal.fire('Deleted!', 'Item has been deleted.', 'success');
      fetchData();
    }
  };

  // Split items by status
  const pending = items.filter((i) => i.status !== "Found");
  const found = items.filter((i) => i.status === "Found");

  // Filter and search logic
  const filteredItems = (list) => {
    return list.filter(i => {
      const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           i.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || i.type === filterType;
      return matchesSearch && matchesType;
    });
  };

  const displayList = activeTab === "pending" ? filteredItems(pending) : filteredItems(found);

  const getStatusBadge = (status) => {
    const badges = {
      "Found": "bg-green-100 text-green-800 border-green-200",
      "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return badges[status] || badges["Pending"];
  };

  const getTypeIcon = (type) => {
    const icons = {
      "Lost": "🔍",
      "Found": "✨"
    };
    return icons[type] || "📦";
  };

  // Card Component
  const Card = ({ i }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 group">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gray-100">
          <img
            src={i.image_url}
            alt={i.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg">
              {getTypeIcon(i.type)} {i.type}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-4">
              <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                {i.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {i.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(i.status || "Pending")}`}>
                  {i.status || "Pending"}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(i.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {i.status !== "Found" && (
                  <button
                    onClick={() => updateStatus(i.id, "Found")}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                  >
                    ✓ Mark Found
                  </button>
                )}
                {i.status !== "Pending" && (
                  <button
                    onClick={() => updateStatus(i.id, "Pending")}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                  >
                    ⏳ Mark Pending
                  </button>
                )}
                <button
                  onClick={() => deleteItem(i.id)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🔍 Lost & Found Management
          </h1>
          <p className="text-gray-600">Track and manage lost and found items</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{items.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
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
                <p className="text-sm text-gray-600 font-medium">Found</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{found.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Lost Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {items.filter(i => i.type === "Lost").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔍</span>
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
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
            >
              <option value="all">All Types</option>
              <option value="Lost">Lost Items</option>
              <option value="Found">Found Items</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === "pending"
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                ⏳ Pending ({pending.length})
              </span>
              {activeTab === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("found")}
              className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                activeTab === "found"
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                ✅ Found ({found.length})
              </span>
              {activeTab === "found" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="space-y-4">
          {displayList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-gray-500 text-lg">
                {searchTerm || filterType !== "all" 
                  ? "No items match your filters" 
                  : `No ${activeTab} items`}
              </p>
            </div>
          ) : (
            displayList.map((i) => <Card key={i.id} i={i} />)
          )}
        </div>
      </div>
    </div>
  );
}