import { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/footer'; // optional if you have footer
import api from '../api/axios';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {email,password } = formData;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      // Replace with your API call
      const res = await api.post("/login", formData);
      toast.success("Login successful!");
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      toast.error("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

 return (
  <>
    <style>
      {`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    </style>

    <Toaster position="top-center" />

    {/* Header */}
    <header className="bg-white border-b border-gray-200 shadow-md py-4 px-6 flex items-center justify-between transition-colors duration-300">
      <Link
        to="/"
        className="flex items-baseline text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
      >
        <span className="italic font-serif text-yellow-500">S</span>
        <span className="font-mono text-yellow-500">hop</span>
        <span className="italic font-serif text-black ml-1">zi</span>
      </Link>
    </header>

    {/* Main content */}
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      {/* Left Section */}
{/* Left Section */}
<div className="lg:w-1/2 bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 p-10 flex flex-col justify-center items-center text-center relative overflow-hidden">
  {/* Decorative element */}
  <div className="absolute top-[-40px] left-[-40px] w-48 h-48 bg-yellow-300 rounded-full opacity-30 blur-3xl"></div>
  <div className="absolute bottom-[-40px] right-[-40px] w-56 h-56 bg-yellow-400 rounded-full opacity-20 blur-2xl"></div>

  <div
    className="space-y-6 z-10"
    style={{
      animation: 'fadeInUp 0.6s ease-out both',
    }}
  >
    <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">
      Welcome to <span className="text-yellow-600">Shopzi!</span>
    </h1>

    <p className="text-lg text-gray-700 max-w-md mx-auto leading-relaxed">
      Discover exclusive deals, track orders easily, and enjoy a seamless shopping experience.
    </p>

    <img
      src="/istockphoto-1249219777-612x612.jpg"
      alt="Shopping illustration"
      className="max-w-xs mx-auto mt-4 rounded-md shadow-lg transform hover:scale-105 transition duration-300"
    />
  </div>
</div>


      {/* Right Section (Login Form) */}
      <div className="lg:w-1/2 flex justify-center items-center p-6 sm:p-10 bg-white transition-colors duration-300">
        <div className="w-full max-w-md border border-gray-200 rounded-md shadow-md bg-white px-6 py-8 transition-colors duration-300">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Sign-In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
            <p className="text-sm text-right">
  <Link to="/forgot-password" className="text-blue-500 hover:underline">
    Forgot Password?
  </Link>
</p>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 rounded shadow flex items-center justify-center transition"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <p className="text-sm mt-4 text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>

    {/* Optional footer */}
    <Footer />
  </>
);

}
