import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

export default function LostFound() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "lost" });
  const [editItem, setEditItem] = useState(null);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  // Fetch items
  const fetchItems = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("lost_found_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return Swal.fire(error.message, "", "error");
    setItems(data || []);
  };

  useEffect(() => { fetchItems(); }, [user]);

  // Upload image
  const uploadImage = async () => {
    if (!file) return editItem?.image_url || null;
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("lostfound-images")
      .upload(fileName, file);

    if (uploadError) {
      Swal.fire(uploadError.message, "", "error");
      return null;
    }

    const { data } = supabase.storage.from("lostfound-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Add or Edit item
  const saveItem = async () => {
    if (!form.title || !form.description || !form.type)
      return Swal.fire("All fields are required!", "", "error");
    if (!user) return Swal.fire("User not found!", "", "error");

    setLoading(true);
    const imageUrl = await uploadImage();

    if (editItem) {
      // Edit
      const { error } = await supabase
        .from("lost_found_items")
        .update({ ...form, image_url: imageUrl })
        .eq("id", editItem.id);
      if (error) return Swal.fire(error.message, "", "error");
      Swal.fire("Item updated!", "", "success");
      setEditItem(null);
    } else {
      // Add
      const { error } = await supabase.from("lost_found_items").insert([
        { user_id: user.id, ...form, image_url: imageUrl, status: "pending", created_at: new Date() },
      ]);
      if (error) return Swal.fire(error.message, "", "error");
      Swal.fire("Item added successfully!", "", "success");
    }

    setForm({ title: "", description: "", type: "lost" });
    setFile(null);
    setLoading(false);
    fetchItems();
  };

  const deleteItem = async (id) => {
    const { error } = await supabase.from("lost_found_items").delete().eq("id", id);
    if (error) return Swal.fire(error.message, "", "error");
    fetchItems();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, description: item.description, type: item.type });
    setFile(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-[#0057a8]">Lost & Found</h1>

      {/* Form */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-5">{editItem ? "Edit Item" : "Post an Item"}</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border p-3 rounded-xl w-full md:w-1/5 focus:ring-2 focus:ring-[#66b032]"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border p-3 rounded-xl w-full md:w-1/4 focus:ring-2 focus:ring-[#66b032]"
          />

          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border p-3 rounded-xl w-full md:w-2/5 focus:ring-2 focus:ring-[#66b032]"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border p-3 rounded-xl w-full md:w-1/5"
          />
        </div>

        <button
          onClick={saveItem}
          disabled={loading}
          className="bg-[#66b032] text-white py-3 px-6 rounded-xl hover:bg-[#5aa12b] font-semibold transition"
        >
          {loading ? (editItem ? "Updating..." : "Adding...") : editItem ? "Update Item" : "Add Item"}
        </button>
      </div>

      {/* Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 && <p className="text-gray-500 col-span-full">No items posted yet.</p>}

        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition relative">
            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-52 object-cover" />}
            <div className="p-4">
              <h3 className="font-bold text-xl mb-2">{item.title}</h3>
              <p className="text-gray-700 mb-2">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${item.type === "lost" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {item.type.toUpperCase()}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-600">
                  Status: {item.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(item)} className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 font-semibold">Edit</button>
                <button onClick={() => deleteItem(item.id)} className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 font-semibold">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
