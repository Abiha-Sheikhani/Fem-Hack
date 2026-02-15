export default function AdminSidebar({ setActive, logout }) {
  return (
    <div className="w-64 bg-[#1e2336] text-white min-h-screen p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        <ul className="space-y-4">
          <li>
            <button onClick={() => setActive("complaints")} className="hover:text-green-400">
              Complaints
            </button>
          </li>
          <li>
            <button onClick={() => setActive("lost-found")} className="hover:text-green-400">
              Lost & Found
            </button>
          </li>
          <li>
            <button onClick={() => setActive("volunteers")} className="hover:text-green-400">
              Volunteers
            </button>
          </li>
          <li>
            <button onClick={() => setActive("users")} className="hover:text-green-400">
              Users
            </button>
          </li>
        </ul>
      </div>
      <button
        onClick={logout}
        className="bg-green-600 px-4 py-2 rounded hover:bg-green-500"
      >
        Logout
      </button>
    </div>
  );
}
