import { useState, useEffect } from "react";
import { supabase } from "../../Config/Supabase";

export default function UserVolunteer() {
  const [event, setEvent] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    const { data } = await supabase.from("volunteers").select("*");
    setList(data);
  };

  const handleSubmit = async () => {
    await supabase.from("volunteers").insert([
      {
        event_name: event,
        status: "pending",
      },
    ]);
    setEvent("");
    fetchVolunteers();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Volunteer</h2>

      <input
        className="border p-2 rounded w-full mb-4"
        placeholder="Event Name"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
      />

      <button onClick={handleSubmit} className="bg-[#0057a8] text-white px-4 py-2 rounded">
        Register
      </button>

      {list.map((v) => (
        <div key={v.id} className="bg-white p-4 rounded shadow mt-3">
          <p>{v.event_name}</p>
          <span>{v.status}</span>
        </div>
      ))}
    </div>
  );
}
