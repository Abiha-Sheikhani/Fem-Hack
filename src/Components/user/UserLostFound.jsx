import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function UserLostFound() {
  const [title, setTitle] = useState("");
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

  const handleSubmit = async () => {
    await supabase.from("lost_found_items").insert([
      {
        title,
        type: "lost",
        status: "pending",
      },
    ]);

    setTitle("");
    fetchItems();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Lost & Found</h2>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Item title"
        />
        <button onClick={handleSubmit} className="bg-[#0057a8] text-white px-4 rounded">
          Post
        </button>
      </div>

      {items.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded shadow mb-2">
          <h3 className="font-semibold">{item.title}</h3>
          <span className="text-sm text-gray-500">{item.status}</span>
        </div>
      ))}
    </div>
  );
}
