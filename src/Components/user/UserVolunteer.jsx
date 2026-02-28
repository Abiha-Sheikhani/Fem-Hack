import { useEffect, useState } from "react";
import { supabase } from "../../Config/Supabase";
import Swal from "sweetalert2";

const SAYLANI_CAMPUSES = [
  "Main Campus - Korangi",
  "North Nazimabad",
  "Gulshan",
  "Malir",
  "FB Area",
  "Saddar",
  "Landhi",
  "Orangi Town",
  "Shah Faisal",
  "Surjani Town"
];

export default function Volunteers() {
  const [vols, setVols] = useState([]);
  const [form, setForm] = useState({ 
    full_name: "",
    roll_no: "",
    campus: "",
    event: "", 
    availability: "",
    hours_available: "",
    profile_image: null
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  // Fetch only this user's volunteers
  const fetchData = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setVols(data || []);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    if (userId) {
      const channel = supabase
        .channel("user-volunteers")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "volunteers",
            filter: `user_id=eq.${userId}`
          },
          fetchData
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [userId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return Swal.fire("File too large", "Please select an image under 5MB", "error");
      }
      setForm({ ...form, profile_image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('volunteer-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('volunteer-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const submitVolunteer = async () => {
    if (!form.full_name || !form.roll_no || !form.campus || !form.event || !form.availability || !form.hours_available) {
      return Swal.fire("Missing Fields", "Please fill all required fields!", "error");
    }

    if (!editId && !form.profile_image) {
      return Swal.fire("Missing Image", "Please upload a profile image!", "error");
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if new one selected
      if (form.profile_image && typeof form.profile_image !== 'string') {
        setUploadingImage(true);
        imageUrl = await uploadImage(form.profile_image);
        setUploadingImage(false);
      }

      if (editId) {
        // Edit existing
        const updateData = {
          full_name: form.full_name,
          roll_no: form.roll_no,
          campus: form.campus,
          event: form.event,
          availability: form.availability,
          hours_available: form.hours_available,
        };
        
        if (imageUrl) updateData.profile_image = imageUrl;

        const { error } = await supabase
          .from("volunteers")
          .update(updateData)
          .eq("id", editId);
          
        if (error) throw error;
        setEditId(null);
        Swal.fire("Success!", "Volunteer registration updated!", "success");
      } else {
        // Add new
        const { data: user } = await supabase.auth.getUser();
        const { error } = await supabase.from("volunteers").insert([
          {
            user_id: user.user.id,
            full_name: form.full_name,
            roll_no: form.roll_no,
            campus: form.campus,
            event: form.event,
            availability: form.availability,
            hours_available: form.hours_available,
            profile_image: imageUrl,
            status: "Pending",
            created_at: new Date(),
          },
        ]);
        if (error) throw error;
        Swal.fire("Success!", "Registered as volunteer successfully!", "success");
      }

      setForm({ 
        full_name: "",
        roll_no: "",
        campus: "",
        event: "", 
        availability: "",
        hours_available: "",
        profile_image: null
      });
      setImagePreview(null);
      setShowForm(false);
      setLoading(false);
      fetchData();
    } catch (error) {
      setLoading(false);
      setUploadingImage(false);
      Swal.fire("Error", error.message, "error");
    }
  };

  const editVolunteer = (vol) => {
    setEditId(vol.id);
    setForm({ 
      full_name: vol.full_name,
      roll_no: vol.roll_no,
      campus: vol.campus,
      event: vol.event, 
      availability: vol.availability,
      hours_available: vol.hours_available,
      profile_image: vol.profile_image
    });
    setImagePreview(vol.profile_image);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteVolunteer = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from("volunteers").delete().eq("id", id);
      if (error) return Swal.fire("Error", error.message, "error");
      Swal.fire("Deleted!", "Volunteer registration has been removed.", "success");
      fetchData();
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm({ 
      full_name: "",
      roll_no: "",
      campus: "",
      event: "", 
      availability: "",
      hours_available: "",
      profile_image: null
    });
    setImagePreview(null);
    setShowForm(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      "Approved": isDark ? "bg-green-900/30 text-green-400 border-green-500/30" : "bg-green-100 text-green-800 border-green-200",
      "Pending": isDark ? "bg-yellow-900/30 text-yellow-400 border-yellow-500/30" : "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Rejected": isDark ? "bg-red-900/30 text-red-400 border-red-500/30" : "bg-red-100 text-red-800 border-red-200"
    };
    return badges[status] || badges["Pending"];
  };

  const getStatusIcon = (status) => {
    const icons = {
      "Approved": "✅",
      "Pending": "⏳",
      "Rejected": "❌"
    };
    return icons[status] || "⏳";
  };

  const statusCounts = {
    total: vols.length,
    pending: vols.filter(v => v.status === "Pending").length,
    approved: vols.filter(v => v.status === "Approved").length,
    rejected: vols.filter(v => v.status === "Rejected").length,
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className={`fixed top-6 right-6 z-50 p-3 rounded-2xl backdrop-blur-xl shadow-lg transition-all duration-300 hover:scale-110 group ${
          isDark 
            ? 'bg-white/10 hover:bg-white/20 border border-white/20' 
            : 'bg-white/80 hover:bg-white border border-gray-200'
        }`}
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 flex items-center gap-3 transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            🤝 Volunteer Registration
          </h1>
          <p className={`transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Register for volunteer opportunities and track your applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", count: statusCounts.total, icon: "🎯", color: "green", gradient: "from-green-500 to-emerald-600" },
            { label: "Pending", count: statusCounts.pending, icon: "⏳", color: "yellow", gradient: "from-yellow-500 to-orange-500" },
            { label: "Approved", count: statusCounts.approved, icon: "✅", color: "green", gradient: "from-green-600 to-teal-600" },
            { label: "Rejected", count: statusCounts.rejected, icon: "❌", color: "red", gradient: "from-red-500 to-pink-600" }
          ].map((stat, idx) => (
            <div key={idx} className={`rounded-xl shadow-lg p-6 border transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-white/5 border-white/10 backdrop-blur-xl' 
                : 'bg-white border-gray-100'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{stat.count}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${stat.gradient}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Register Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            ➕ Register as Volunteer
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className={`p-6 sm:p-8 rounded-2xl shadow-2xl mb-8 border-2 transition-all duration-300 ${
            isDark 
              ? 'bg-white/5 border-emerald-500/30 backdrop-blur-xl' 
              : 'bg-white border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold flex items-center gap-2 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {editId ? "✏️ Edit Registration" : "➕ Register as Volunteer"}
              </h2>
              <button
                onClick={cancelEdit}
                className={`transition-colors duration-300 ${
                  isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Image Upload */}
              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Profile Image <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-500"
                    />
                  )}
                  <label className={`flex-1 cursor-pointer p-4 border-2 border-dashed rounded-xl transition-all hover:border-emerald-500 ${
                    isDark 
                      ? 'border-white/20 bg-white/5 hover:bg-white/10' 
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}>
                    <div className="text-center">
                      <svg className={`mx-auto h-12 w-12 transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className={`mt-1 text-sm transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Click to upload image
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Roll No & Campus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Roll Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 12345"
                    value={form.roll_no}
                    onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Campus <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.campus}
                    onChange={(e) => setForm({ ...form, campus: e.target.value })}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Campus</option>
                    {SAYLANI_CAMPUSES.map(campus => (
                      <option key={campus} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Name */}
              <div>
                <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Community Cleanup, Food Drive"
                  value={form.event}
                  onChange={(e) => setForm({ ...form, event: e.target.value })}
                  className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Availability & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Availability <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Weekends, Mon-Fri evenings"
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value })}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Hours Available <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 10"
                    value={form.hours_available}
                    onChange={(e) => setForm({ ...form, hours_available: e.target.value })}
                    className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className={`border-l-4 border-blue-500 p-4 rounded-lg ${
                isDark ? 'bg-blue-900/20' : 'bg-blue-50'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${
                      isDark ? 'text-blue-300' : 'text-blue-900'
                    }`}>Pro Tip</p>
                    <p className={`text-sm ${
                      isDark ? 'text-blue-200' : 'text-blue-700'
                    }`}>
                      Be specific about your availability and hours to help organizers match you with suitable opportunities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={submitVolunteer}
                  disabled={loading || uploadingImage}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || uploadingImage ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {uploadingImage ? "Uploading..." : editId ? "Updating..." : "Registering..."}
                    </span>
                  ) : (
                    editId ? "💾 Update Registration" : "📤 Submit Registration"
                  )}
                </button>
                <button
                  onClick={cancelEdit}
                  className={`px-6 py-3 border-2 rounded-xl transition-all font-semibold ${
                    isDark
                      ? 'border-white/20 text-gray-300 hover:bg-white/10'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Volunteers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vols.length === 0 ? (
            <div className={`col-span-full rounded-xl shadow-md p-12 text-center transition-all duration-300 ${
              isDark ? 'bg-white/5 backdrop-blur-xl' : 'bg-white'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <span className="text-4xl">🤝</span>
              </div>
              <p className={`text-lg mb-4 transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>No volunteer registrations yet</p>
              <p className={`text-sm transition-colors duration-300 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>Click the button above to register for your first volunteer opportunity</p>
            </div>
          ) : (
            vols.map((v) => (
              <div
                key={v.id}
                className={`rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border group ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 backdrop-blur-xl' 
                    : 'bg-white border-gray-100 hover:border-green-200'
                }`}
              >
                {/* Profile Header */}
                <div className="relative h-32 bg-gradient-to-br from-green-500 to-emerald-600">
                  <div className="absolute -bottom-12 left-6">
                    <img 
                      src={v.profile_image || 'https://via.placeholder.com/150'} 
                      alt={v.full_name}
                      className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(v.status)}`}>
                    {getStatusIcon(v.status)} {v.status}
                  </span>
                </div>

                <div className="p-6 pt-16">
                  {/* Name & Roll No */}
                  <h3 className={`font-bold text-xl mb-1 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {v.full_name}
                  </h3>
                  <p className={`text-sm mb-3 transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Roll No: {v.roll_no} • {v.campus}
                  </p>

                  {/* Event */}
                  <div className={`rounded-lg p-3 mb-3 ${
                    isDark ? 'bg-white/5' : 'bg-gradient-to-r from-green-50 to-blue-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎯</span>
                      <p className={`text-xs font-medium transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>Event</p>
                    </div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-gray-700'
                    }`}>{v.event}</p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`rounded-lg p-2 ${
                      isDark ? 'bg-white/5' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">📅</span>
                        <p className={`text-xs font-medium transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>Availability</p>
                      </div>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-700'
                      }`}>{v.availability}</p>
                    </div>

                    <div className={`rounded-lg p-2 ${
                      isDark ? 'bg-white/5' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">⏰</span>
                        <p className={`text-xs font-medium transition-colors duration-300 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>Hours</p>
                      </div>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-gray-700'
                      }`}>{v.hours_available}hrs</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className={`flex items-center gap-2 text-xs mb-4 pb-4 border-b transition-colors duration-300 ${
                    isDark ? 'text-gray-500 border-white/10' : 'text-gray-500 border-gray-100'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(v.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => editVolunteer(v)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteVolunteer(v.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            🌟 Why Volunteer with Saylani?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-xl">💪</span>
              <div>
                <p className="font-semibold mb-1">Make a Difference</p>
                <p className="text-green-100">Contribute to meaningful causes and help your community</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">🤝</span>
              <div>
                <p className="font-semibold mb-1">Build Connections</p>
                <p className="text-green-100">Meet like-minded people and expand your network</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">📈</span>
              <div>
                <p className="font-semibold mb-1">Gain Experience</p>
                <p className="text-green-100">Develop new skills and enhance your resume</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}