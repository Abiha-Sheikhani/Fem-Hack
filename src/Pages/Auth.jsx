import { useState } from "react";
import { supabase } from "../Config/Supabase";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function AuthCard() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

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
        role: "user",
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
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-20 w-72 h-72 rounded-full blur-3xl animate-pulse transition-colors duration-500 ${
          isDark ? 'bg-blue-500/10' : 'bg-blue-400/20'
        }`}></div>
        <div className={`absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 transition-colors duration-500 ${
          isDark ? 'bg-emerald-500/10' : 'bg-purple-400/20'
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl transition-colors duration-500 ${
          isDark ? 'bg-blue-600/5' : 'bg-indigo-300/20'
        }`}></div>
      </div>

      {/* Grain texture overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isDark ? 'opacity-[0.015]' : 'opacity-[0.02]'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-6 right-6 z-50 p-3 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-110 group ${
          isDark 
            ? 'bg-white/10 hover:bg-white/20 border border-white/20' 
            : 'bg-white/80 hover:bg-white border border-gray-200 shadow-xl'
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg className="w-6 h-6 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Main card */}
      <div className="w-full max-w-md relative z-10">
        {/* Card with adaptive styling */}
        <div className={`rounded-3xl p-10 shadow-2xl relative overflow-hidden group transition-all duration-500 ${
          isDark 
            ? 'bg-white/5 backdrop-blur-2xl border border-white/10 shadow-black/50 hover:border-white/20' 
            : 'bg-white/90 backdrop-blur-xl border border-white/60 shadow-indigo-200/50 hover:shadow-2xl hover:border-indigo-300'
        }`}>
          {/* Subtle gradient overlay */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            isDark 
              ? 'bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100' 
              : 'bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100'
          }`}></div>

          {/* Content */}
          <div className="relative z-10">
            {/* Logo/Brand section */}
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-4 shadow-lg transition-shadow duration-300 ${
                isDark ? 'shadow-blue-500/30 group-hover:shadow-blue-500/50' : 'shadow-blue-500/40 group-hover:shadow-blue-500/60'
              }`}>
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-emerald-300 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                Saylani Mass IT Hub
              </h1>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {isSignup ? "Create your account" : "Welcome back"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className={`flex gap-2 mb-8 p-1 rounded-2xl border transition-colors duration-300 ${
              isDark 
                ? 'bg-white/5 border-white/10' 
                : 'bg-gray-100/80 border-gray-200'
            }`}>
              <button
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  !isSignup
                    ? `bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg ${
                        isDark ? 'shadow-blue-500/30' : 'shadow-blue-500/40'
                      }`
                    : isDark 
                      ? 'text-slate-400 hover:text-slate-300' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isSignup
                    ? `bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg ${
                        isDark ? 'shadow-blue-500/30' : 'shadow-blue-500/40'
                      }`
                    : isDark 
                      ? 'text-slate-400 hover:text-slate-300' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Username field - only for signup */}
              {isSignup && (
                <div className="group/input">
                  <label className={`block text-sm font-medium mb-2 ml-1 transition-colors duration-300 ${
                    isDark ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg
                        className={`w-5 h-5 transition-colors ${
                          isDark 
                            ? 'text-slate-500 group-focus-within/input:text-blue-400' 
                            : 'text-gray-400 group-focus-within/input:text-blue-500'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="Enter your username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 hover:border-white/20'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="group/input">
                <label className={`block text-sm font-medium mb-2 ml-1 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className={`w-5 h-5 transition-colors ${
                        isDark 
                          ? 'text-slate-500 group-focus-within/input:text-blue-400' 
                          : 'text-gray-400 group-focus-within/input:text-blue-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none transition-all duration-300 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 hover:border-white/20'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="group/input">
                <label className={`block text-sm font-medium mb-2 ml-1 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className={`w-5 h-5 transition-colors ${
                        isDark 
                          ? 'text-slate-500 group-focus-within/input:text-blue-400' 
                          : 'text-gray-400 group-focus-within/input:text-blue-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none transition-all duration-300 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 hover:border-white/20'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Forgot password - only for login */}
              {!isSignup && (
                <div className="flex justify-end">
                  <button className={`text-sm transition-colors ${
                    isDark 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-700'
                  }`}>
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={isSignup ? handleSignup : handleLogin}
              disabled={loading}
              className={`w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${
                isDark ? 'shadow-blue-500/30 hover:shadow-blue-500/50' : 'shadow-blue-500/40 hover:shadow-blue-500/60'
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Please wait...</span>
                </>
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t transition-colors duration-300 ${
                  isDark ? 'border-white/10' : 'border-gray-200'
                }`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 bg-transparent transition-colors duration-300 ${
                  isDark ? 'text-slate-500' : 'text-gray-500'
                }`}>
                  or continue with
                </span>
              </div>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className={`flex items-center justify-center gap-3 py-3 px-4 border rounded-xl transition-all duration-300 group ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className={`font-medium text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>Google</span>
              </button>

              <button className={`flex items-center justify-center gap-3 py-3 px-4 border rounded-xl transition-all duration-300 group ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                  : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}>
                <svg className={`w-5 h-5 transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span className={`font-medium text-sm transition-colors duration-300 ${
                  isDark ? 'text-slate-300' : 'text-gray-700'
                }`}>GitHub</span>
              </button>
            </div>

            {/* Terms */}
            {isSignup && (
              <p className={`mt-6 text-center text-xs transition-colors duration-300 ${
                isDark ? 'text-slate-500' : 'text-gray-500'
              }`}>
                By signing up, you agree to our{" "}
                <button className={`transition-colors ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}>
                  Terms of Service
                </button>{" "}
                and{" "}
                <button className={`transition-colors ${
                  isDark 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}>
                  Privacy Policy
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Bottom decoration */}
        <div className={`mt-6 flex items-center justify-center gap-1 text-sm transition-colors duration-300 ${
          isDark ? 'text-slate-500' : 'text-gray-600'
        }`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Secured with industry-standard encryption</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          ${isDark ? `
            -webkit-text-fill-color: white;
            -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.05) inset;
          ` : `
            -webkit-text-fill-color: rgb(17, 24, 39);
            -webkit-box-shadow: 0 0 0px 1000px white inset;
          `}
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}