import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function UserComplaints() {
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    const { data } = await supabase.from("complaints").select("*");
    setComplaints(data);
  };

  const handleSubmit = async () => {
    await supabase.from("complaints").insert([
      {
        category: "General",
        description,
        status: "submitted",
      },
    ]);
    setDescription("");
    fetchComplaints();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Complaints</h2>

      <textarea
        className="border w-full p-2 rounded mb-4"
        placeholder="Write complaint..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={handleSubmit} className="bg-[#0057a8] text-white px-4 py-2 rounded">
        Submit
      </button>

      {complaints.map((c) => (
        <div key={c.id} className="bg-white p-4 rounded shadow mt-3">
          <p>{c.description}</p>
          <span className="text-sm">{c.status}</span>
        </div>
      ))}
    </div>
  );
}
