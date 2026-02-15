import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function Notifications() {
  const [notes, setNotes] = useState([]);

  const fetchData = async () => {
    const { data: user } = await supabase.auth.getUser();
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.user.id).order("created_at",{ascending:false});
    setNotes(data || []);
  };

  useEffect(()=>{ fetchData(); }, []);

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchData();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {notes.map(n=>(
        <div key={n.id} className={`border p-3 mb-2 rounded ${n.is_read ? 'bg-gray-200':'bg-white'}`}>
          <p>{n.message}</p>
          {!n.is_read && <button onClick={()=>markRead(n.id)} className="bg-blue-600 text-white px-2 py-1 mt-1 rounded">Mark Read</button>}
        </div>
      ))}
    </div>
  );
}
