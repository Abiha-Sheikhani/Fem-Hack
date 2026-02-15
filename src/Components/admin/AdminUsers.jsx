import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const fetchData = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at",{ascending:false});
    setUsers(data || []);
  };

  useEffect(()=>{ fetchData(); }, []);

  const deleteUser = async (id) => {
    await supabase.from("users").delete().eq("id", id);
    fetchData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      {users.map(u=>(
        <div key={u.id} className="border p-4 mb-3 rounded bg-white shadow flex justify-between items-center">
          <div>
            <p><strong>Username:</strong> {u.username}</p>
            <p><strong>Email:</strong> {u.email}</p>
            <p><strong>Role:</strong> {u.role}</p>
          </div>
          <button onClick={()=>deleteUser(u.id)} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
        </div>
      ))}
    </div>
  );
}
