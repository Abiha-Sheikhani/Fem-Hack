import { useState } from "react";
import { supabase } from "../Config/Supabase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AuthCard() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // SIGNUP
  const handleSignup = async () => {
    const { username, email, password } = formData;

    if (!username || !email || !password) {
      return Swal.fire("All fields required", "", "error");
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return Swal.fire(error.message, "", "error");
    }

    // Insert into users table
    const { error: insertError } = await supabase.from("users").insert([
      {
        uid: data.user.id,
        username,
        email,
        role: "user", // hardcoded role
      },
    ]);

    setLoading(false);

    if (insertError) {
      return Swal.fire(insertError.message, "", "error");
    }

    Swal.fire("Signup Successful!", "", "success");
    setIsSignup(false);
    setFormData({ username: "", email: "", password: "" });
  };

  // LOGIN


const navigate = useNavigate();

const handleLogin = async () => {
  const { email, password } = formData;

  if (!email || !password) {
    return Swal.fire("All fields required", "", "error");
  }

  setLoading(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setLoading(false);
    return Swal.fire(error.message, "", "error");
  }

  // Get user role from users table
  const { data: userData, error: roleError } = await supabase
    .from("users")
    .select("*")
    .eq("uid", data.user.id)
    .single();

  setLoading(false);

  if (roleError) {
    return Swal.fire("User data not found", "", "error");
  }

  Swal.fire("Login Successful!", "", "success");

  if (userData.role === "admin") {
    navigate("/admin");
  } else {
    navigate("/user");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border">

        <h2 className="text-2xl font-bold text-center mb-6 text-[#0057a8]">
          Saylani Mass IT Hub
        </h2>

        {isSignup && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full mb-4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#66b032]"
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mb-4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#66b032]"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mb-6 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#66b032]"
        />

        <button
          onClick={isSignup ? handleSignup : handleLogin}
          disabled={loading}
          className="w-full bg-[#66b032] text-white py-3 rounded-lg hover:bg-[#5aa12b] transition font-semibold"
        >
          {loading
            ? "Please wait..."
            : isSignup
            ? "Create Account"
            : "Login"}
        </button>

        <p className="text-center mt-4 text-sm">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <span
            onClick={() => setIsSignup(!isSignup)}
            className="ml-1 text-[#0057a8] font-semibold cursor-pointer"
          >
            {isSignup ? "Login" : "Signup"}
          </span>
        </p>
      </div>
    </div>
  );
}
