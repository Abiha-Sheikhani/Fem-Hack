import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function AdminLostFound() {
  const [items, setItems] = useState([]);

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

  // Update item status (Pending → Found)
  const updateStatus = async (id, status) => {
    await supabase.from("lost_found_items").update({ status }).eq("id", id);

    const item = items.find((i) => i.id === id);
    if (item) {
      await supabase.from("notifications").insert({
        user_id: item.user_id,
        message: `Your ${item.type} item "${item.title}" is now ${status}`,
      });
    }

    fetchData();
  };

  // Delete item
  const deleteItem = async (id) => {
    await supabase.from("lost_found_items").delete().eq("id", id);
    fetchData();
  };

  // Split items by status
  const pending = items.filter((i) => i.status !== "Found");
  const found = items.filter((i) => i.status === "Found");

  // Card Component
  const Card = ({ i }) => (
    <div className="bg-white p-5 rounded-2xl shadow-lg hover:shadow-2xl transition flex flex-col md:flex-row md:justify-between items-start md:items-center space-y-3 md:space-y-0">
      <img
        src={i.image_url}
        alt={i.title}
        className="w-32 h-32 object-cover rounded-xl border"
      />
      <div className="flex-1 md:ml-4">
        <h3 className="font-bold text-xl">{i.title}</h3>
        <p className="text-gray-700 mb-1">{i.description}</p>
        <p className="text-sm text-gray-500">
          Type: {i.type} | Status:{" "}
          <span
            className={
              i.status === "Found"
                ? "text-green-600"
                : i.status === "Pending"
                ? "text-yellow-500"
                : "text-gray-500"
            }
          >
            {i.status || "Pending"}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Submitted: {new Date(i.created_at).toLocaleString()}
        </p>
      </div>

      <div className="flex flex-col space-y-2 mt-3 md:mt-0">
        {i.status !== "Found" && (
          <button
            onClick={() => updateStatus(i.id, "Found")}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-semibold transition"
          >
            Mark Found
          </button>
        )}
        {i.status !== "Pending" && (
          <button
            onClick={() => updateStatus(i.id, "Pending")}
            className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500 font-semibold transition"
          >
            Mark Pending
          </button>
        )}
        <button
          onClick={() => deleteItem(i.id)}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold transition"
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-[#0057a8]">Lost & Found Items</h1>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Pending Items</h2>
        {pending.length === 0 && <p className="text-gray-500">No pending items</p>}
        <div className="space-y-4">{pending.map((i) => <Card key={i.id} i={i} />)}</div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Found Items</h2>
        {found.length === 0 && <p className="text-gray-500">No found items</p>}
        <div className="space-y-4">{found.map((i) => <Card key={i.id} i={i} />)}</div>
      </div>
    </div>
  );
}
