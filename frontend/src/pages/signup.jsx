// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/axios';
import Footer from '../components/footer'
export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { full_name, email, mobile, password } = formData;

    // Validation
    if (!email || !password || !full_name || !mobile) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/\d/.test(password)) {
      toast.error("Password must contain at least one number.");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error("Password must contain at least one special character.");
      return;
    }

    if (full_name.length < 2 || full_name.length > 50 || /^\d+$/.test(full_name)) {
      toast.error("Please enter a valid name.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    // Submit
    try {
      setLoading(true);
      const res = await api.post("/signup", formData);
      toast.success(res.data.message || "Signup successful!");
      setFormData({ full_name: '', email: '', mobile: '', password: '' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <Toaster
  position="top-center"
  toastOptions={{
    style: {
      marginTop: '80px', // adjust this value as needed
    },
  }}
/>

      <div className="w-full max-w-md">
        {/* Logo */}
<div className="flex justify-center mb-6">
  <Link
    to="/"
    className="flex items-baseline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
  >
    <span className="italic font-serif text-yellow-500">S</span>
    <span className="font-mono text-yellow-500">hop</span>
    <span className="italic font-serif text-black ml-1">zi</span>
  </Link>
</div>



        {/* Card */}
        <div className="border border-gray-300 bg-white px-8 py-6 rounded-md shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            <input
              type="text"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 bg-white text-gray-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 rounded shadow transition flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-2 text-black" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              ) : null}
              {loading ? "Signing up..." : "Continue"}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4">
            By continuing, you agree to Shopzi’s{' '}
            <span className="text-blue-500 hover:underline cursor-pointer">Conditions of Use</span> and{' '}
            <span className="text-blue-500 hover:underline cursor-pointer">Privacy Notice</span>.
          </p>

          <p className="text-sm text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
    <Footer/>
    </>
  );
}
