export default function Sidebar({ setActive, logout }) {
  return (
    <div className="w-64 bg-[#0057a8] text-white min-h-screen p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-8">User Panel</h1>
        <ul className="space-y-4">
          <li><button onClick={()=>setActive("complaints")} className="hover:text-green-300">Complaints</button></li>
          <li><button onClick={()=>setActive("lost-found")} className="hover:text-green-300">Lost & Found</button></li>
          <li><button onClick={()=>setActive("volunteers")} className="hover:text-green-300">Volunteers</button></li>
          <li><button onClick={()=>setActive("notifications")} className="hover:text-green-300">Notifications</button></li>
        </ul>
      </div>
      <button onClick={logout} className="bg-[#66b032] px-4 py-2 rounded hover:bg-[#5aa12b]">Logout</button>
    </div>
  );
}
