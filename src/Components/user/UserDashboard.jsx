import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    complaints: 0,
    lostItems: 0,
    foundItems: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUser(userData.user);

        // Fetch user's data from users table
        const { data: userProfile } = await supabase
          .from("users")
          .select("*")
          .eq("uid", userData.user.id)
          .single();

        // Fetch complaints count
        const { count: complaintsCount } = await supabase
          .from("complaints")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.user.id);

        // Fetch lost & found items
        const { data: lostFoundData } = await supabase
          .from("lost_found_items")
          .select("type")
          .eq("user_id", userData.user.id);

        const lostCount = lostFoundData?.filter(item => item.type === "Lost").length || 0;
        const foundCount = lostFoundData?.filter(item => item.type === "Found").length || 0;

        // Fetch unread notifications count
        const { count: notificationsCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userData.user.id)
          .eq("is_read", false);

        setStats({
          complaints: complaintsCount || 0,
          lostItems: lostCount,
          foundItems: foundCount,
          notifications: notificationsCount || 0
        });
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const quickActions = [
    {
      title: "Submit Complaint",
      description: "Report an issue or concern",
      icon: "📋",
      color: "from-blue-500 to-blue-600",
      action: () => window.location.hash = "#/user/complaints"
    },
    {
      title: "Lost & Found",
      description: "Post or search for items",
      icon: "🔍",
      color: "from-purple-500 to-purple-600",
      action: () => window.location.hash = "#/user/lost-found"
    },
    {
      title: "Notifications",
      description: "Check your updates",
      icon: "🔔",
      color: "from-indigo-500 to-indigo-600",
      action: () => window.location.hash = "#/user/notifications",
      badge: stats.notifications
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                    {getGreeting()}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Welcome back to your dashboard
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-100 mb-1">Member Since</p>
                  <p className="text-lg font-bold">
                    {new Date(user?.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats.complaints}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">My Complaints</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats.lostItems}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Lost Items</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats.foundItems}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Found Items</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔔</span>
                  </div>
                  <span className="text-3xl font-bold text-gray-900">{stats.notifications}</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Unread Notifications</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-left group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                          {action.icon}
                        </div>
                        {action.badge > 0 && (
                          <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full font-bold">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  💡 Getting Started
                </h3>
                <ul className="space-y-2 text-blue-100">
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Submit complaints for any issues you face</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Post lost or found items to help the community</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Track your submissions and get real-time updates</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  📊 Activity Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">Total Activities</span>
                    <span className="font-bold text-xl">
                      {stats.complaints + stats.lostItems + stats.foundItems}
                    </span>
                  </div>
                  <div className="w-full bg-purple-400/30 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{ 
                        width: `${Math.min(((stats.complaints + stats.lostItems + stats.foundItems) / 20) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-purple-100 text-sm">
                    Keep engaging with the platform to track your progress!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}