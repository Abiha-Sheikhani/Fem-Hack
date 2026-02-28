import { useState } from 'react';

export default function Sidebar({ setActive, logout, activeSection }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
   
    { id: 'complaints', label: 'My Complaints', icon: '📋' },
    { id: 'lost-found', label: 'Lost & Found', icon: '🔍' },
    { id: 'volunteers', label: 'Volunteer', icon: '🤝' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const handleMenuClick = (id) => {
    setActive(id);
    setIsOpen(false); // Close menu after selection on mobile
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-linear-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`block h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-purple-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-linear-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                User Panel
              </h2>
              <p className="text-xs text-blue-200">Welcome back!</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 group relative overflow-hidden
                ${activeSection === item.id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transform scale-105' 
                  : 'hover:bg-white/10 hover:translate-x-1'
                }
              `}
            >
              {/* Active indicator */}
              {activeSection === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
              )}
              
              {/* Icon */}
              <span className={`text-2xl transition-transform ${
                activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                {item.icon}
              </span>
              
              {/* Label */}
              <span className={`font-medium flex-1 text-left ${
                activeSection === item.id ? 'text-white' : 'text-blue-100'
              }`}>
                {item.label}
              </span>

              {/* Arrow indicator for active item */}
              {activeSection === item.id && (
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          ))}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4 mb-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-lg">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">User</p>
                <p className="text-xs text-blue-200">Member</p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl group"
          >
            <span className="group-hover:rotate-12 transition-transform">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}