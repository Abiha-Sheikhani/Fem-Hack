import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read

  const fetchData = async () => {
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false });
    
    if (!error) setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const fetchUser = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const channel = supabase
          .channel("user-notifications")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.user.id}`
            },
            fetchData
          )
          .subscribe();

        return () => supabase.removeChannel(channel);
      }
    };

    fetchUser();
  }, []);

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchData();
  };

  const markAllRead = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.user.id)
      .eq("is_read", false);
    
    fetchData();
  };

  const deleteNotification = async (id) => {
    await supabase.from("notifications").delete().eq("id", id);
    fetchData();
  };

  const filteredNotes = notes.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notes.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600">Stay updated with your latest notifications</p>
        </div>

        {/* Stats and Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{notes.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{unreadCount}</p>
                <p className="text-sm text-gray-600">Unread</p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md whitespace-nowrap"
              >
                ✓ Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { key: "all", label: "All", count: notes.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: notes.length - unreadCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-6 py-4 font-semibold transition-all relative ${
                  filter === tab.key
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab.label} ({tab.count})
                </span>
                {filter === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📭</span>
              </div>
              <p className="text-gray-500 text-lg">
                {filter === "all" 
                  ? "No notifications yet" 
                  : filter === "unread"
                  ? "No unread notifications"
                  : "No read notifications"}
              </p>
            </div>
          ) : (
            filteredNotes.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border ${
                  n.is_read
                    ? "bg-white border-gray-100"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      n.is_read ? "bg-gray-200" : "bg-blue-500"
                    }`}>
                      <span className="text-xl">{n.is_read ? "📬" : "📬"}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base mb-2 ${
                        n.is_read ? "text-gray-600" : "text-gray-900 font-medium"
                      }`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(n.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!n.is_read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-xs whitespace-nowrap shadow-sm hover:shadow-md"
                        >
                          ✓ Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold text-xs whitespace-nowrap shadow-sm hover:shadow-md"
                      >
                        🗑️
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