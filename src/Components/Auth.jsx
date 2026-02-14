import { useState } from "react";
import { supabase } from "../Config/Supabase";
import Swal from "sweetalert2";

export default function AuthCard() {
  const [isSignup, setIsSignup] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    const { username, email, password } = formData;

    if (!username || !email || !password) {
      Swal.fire("Please enter all fields!", "", "error");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      Swal.fire(error.message, "", "error");
      return;
    }

    await supabase.from("users-data").insert([
      {
        name: username,
        email,
        role: "user",
        uid: data.user.id,
      },
    ]);

    Swal.fire("Signup Successful!", "", "success");

    setIsSignup(false);
    setFormData({ username: "", email: "", password: "" });
  };

  const handleLogin = async () => {
    const { email, password } = formData;

    if (!email || !password) {
      Swal.fire("Please enter all fields!", "", "error");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Swal.fire("Login Failed!", error.message, "error");
      return;
    }

    Swal.fire("Login Successful!", "", "success");

    setTimeout(() => {
      window.location.href = "/post";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-4">

      <div className="w-full max-w-[820px] bg-[#242b43] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative md:h-[420px]">

        {/* Sidebar - Horizontal on mobile, vertical on desktop */}
        <div className="w-full md:w-[140px] flex md:flex-col flex-row justify-center items-center relative bg-[#1e2336] md:order-1 order-1 shrink-0">

          {/* Active indicator - Bottom border on mobile, left border on desktop */}
          <div
            className={`absolute bg-[#496cf5] transition-all duration-[400ms] ease-out
              md:left-0 md:w-[5px] md:h-1/3 md:rounded-r-md
              bottom-0 h-[5px] w-1/2 rounded-t-md
              ${isSignup 
                ? "md:top-[66.66%] left-1/2" 
                : "md:top-[33.33%] left-0"
              }
            `}
          />

          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 md:h-1/3 h-16 text-sm tracking-wide transition-all duration-300 font-medium ${
              !isSignup ? "text-[#6387ff]" : "text-gray-400"
            }`}
          >
            SIGN IN
          </button>

          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 md:h-1/3 h-16 text-sm tracking-wide transition-all duration-300 font-medium ${
              isSignup ? "text-[#6387ff]" : "text-gray-400"
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Desktop Hero - Only visible on desktop */}
        <div className="hidden md:block md:w-[350px] bg-[#496cf5] relative overflow-hidden -my-12 rounded-xl shrink-0 md:order-2">

          <div
            className="absolute top-0 left-0 w-full h-[200%] transition-all duration-500 ease-in-out"
            style={{
              transform: isSignup ? 'translateY(-50%)' : 'translateY(0)'
            }}
          >
            {/* SIGN IN HERO */}
            <div className="h-1/2 flex flex-col justify-center px-8 text-white">
              <h2 className="text-2xl font-semibold mb-3">
                Welcome Back.
              </h2>
              <p className="text-sm opacity-80 mb-6">
                Please enter your credentials.
              </p>
              <img src="/signin.PNG" className="w-full object-contain max-h-[200px]" alt="Sign in" />
            </div>

            {/* SIGN UP HERO */}
            <div className="h-1/2 flex flex-col justify-center px-8 text-white">
              <h2 className="text-2xl font-semibold mb-3">
                Join The Crowd.
              </h2>
              <p className="text-sm opacity-80 mb-6">
                Sign up now and get started today.
              </p>
              <img src="/signup.PNG" className="w-full object-contain max-h-[200px]" alt="Sign up" />
            </div>
          </div>
        </div>

        {/* Forms Section */}
        <div className="flex-1 relative overflow-hidden md:order-3 order-2 min-h-[500px] md:min-h-0">

          <div
            className="absolute top-0 left-0 w-full transition-all duration-500 ease-in-out"
            style={{
              height: '200%',
              transform: isSignup ? 'translateY(-50%)' : 'translateY(0)'
            }}
          >
            {/* SIGN IN FORM */}
            <div className="h-1/2 min-h-[550px] md:min-h-0 px-6 md:px-10 py-8 md:py-0 flex flex-col justify-center gap-4 md:gap-5 text-white">

              {/* Mobile image - only visible on small screens */}
              <div className="md:hidden mb-4 text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome Back.</h2>
                <p className="text-xs opacity-80 mb-3">Please enter your credentials.</p>
                <img src="/signin.PNG" className="w-full max-w-[200px] mx-auto object-contain" alt="Sign in" />
              </div>

              <p className="text-sm text-gray-300">
                Don't have an account?{" "}
                <span
                  onClick={() => setIsSignup(true)}
                  className="text-[#6387ff] cursor-pointer hover:underline"
                >
                  Sign Up
                </span>
              </p>

              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
                className="h-12 px-4 rounded-lg bg-white/10 border-0 focus:outline-none focus:ring-2 focus:ring-[#6387ff] text-white placeholder:text-gray-400"
              />

              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                placeholder="Password"
                className="h-12 px-4 rounded-lg bg-white/10 border-0 focus:outline-none focus:ring-2 focus:ring-[#6387ff] text-white placeholder:text-gray-400"
              />

              <button
                onClick={handleLogin}
                className="h-12 rounded-lg bg-[#496cf5] hover:bg-[#5a7cff] transition-all duration-300 font-medium tracking-wider text-white"
              >
                SIGN IN
              </button>
            </div>

            {/* SIGN UP FORM */}
            <div className="h-1/2 min-h-[600px] md:min-h-0 px-6 md:px-10 py-8 md:py-0 flex flex-col justify-center gap-3 md:gap-4 text-white">

              {/* Mobile image - only visible on small screens */}
              <div className="md:hidden mb-4 text-center">
                <h2 className="text-xl font-semibold mb-2">Join The Crowd.</h2>
                <p className="text-xs opacity-80 mb-3">Sign up now and get started today.</p>
                <img src="/signup.PNG" className="w-full max-w-[200px] mx-auto object-contain" alt="Sign up" />
              </div>

              <p className="text-sm text-gray-300">
                Already have an account?{" "}
                <span
                  onClick={() => setIsSignup(false)}
                  className="text-[#6387ff] cursor-pointer hover:underline"
                >
                  Sign In
                </span>
              </p>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                type="text"
                className="h-12 px-4 rounded-lg bg-white/10 border-0 focus:outline-none focus:ring-2 focus:ring-[#6387ff] text-white placeholder:text-gray-400"
              />

              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
                className="h-12 px-4 rounded-lg bg-white/10 border-0 focus:outline-none focus:ring-2 focus:ring-[#6387ff] text-white placeholder:text-gray-400"
              />

              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                type="password"
                placeholder="Password"
                className="h-12 px-4 rounded-lg bg-white/10 border-0 focus:outline-none focus:ring-2 focus:ring-[#6387ff] text-white placeholder:text-gray-400"
              />

              <button
                onClick={handleSignup}
                className="h-12 rounded-lg bg-[#496cf5] hover:bg-[#5a7cff] transition-all duration-300 font-medium tracking-wider text-white"
              >
                SIGN UP
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}