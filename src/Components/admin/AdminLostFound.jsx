import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";

export default function AdminLostFound() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("lost_found_items")
      .select("*")
      .order("created_at", { ascending: false });

    setItems(data);
  };

  const updateStatus = async (id, status) => {
    await supabase
      .from("lost_found_items")
      .update({ status })
      .eq("id", id);

    fetchItems();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Lost & Found</h2>

      {items.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded shadow mb-3">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm mb-2">Status: {item.status}</p>

          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(item.id, "matched")}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Match
            </button>

            <button
              onClick={() => updateStatus(item.id, "resolved")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
