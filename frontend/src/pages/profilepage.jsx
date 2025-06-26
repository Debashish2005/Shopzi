import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Package, MapPin, Lock, LogOut, Pencil } from "lucide-react";
import api from "../api/axios";
import Header from "../components/header";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
const [passwordForm, setPasswordForm] = useState({
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});

const handlePasswordChange = (e) => {
  setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
};

const handlePasswordSubmit = async (e) => {
  e.preventDefault();

  if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
    return alert("New passwords do not match.");
  }

  try {
    const res = await api.post("/change-password", passwordForm, { withCredentials: true });
    alert(res.data.message);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setShowPasswordForm(false);
  } catch (err) {
    alert(err.response?.data?.message || "Failed to change password.");
    console.error(err);
  }
};

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await api.post("/logout");
    navigate("/login");
  };


  const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState({
  full_name: "",
  email: "",
  mobile: "",
});

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await api.get("/me", { withCredentials: true });
      setUser(res.data);
      setFormData({
        full_name: res.data.full_name,
        email: res.data.email,
        mobile: res.data.mobile || "",
      });
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };
  fetchUser();
}, []);

const handleEditToggle = () => setIsEditing(true);
const handleCancelEdit = () => {
  setIsEditing(false);
  setFormData({
    full_name: user.full_name,
    email: user.email,
    mobile: user.mobile || "",
  });
};

const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSave = async () => {
  try {
    const res = await api.put("/me", formData, { withCredentials: true });
    setUser(res.data);
    setIsEditing(false);
  } catch (err) {
    console.error("Failed to update profile:", err);
    alert("Failed to update profile.");
  }
};

  return (
    <>
    <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
      {/* User Info Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
  <div>
    {isEditing ? (
      <>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Full Name */}
  <div>
    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
      Full Name
    </label>
    <input
      id="full_name"
      type="text"
      name="full_name"
      value={formData.full_name}
      onChange={handleChange}
      className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* Email */}
  <div>
    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
      Email Address
    </label>
    <input
      id="email"
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* Mobile */}
  <div className="md:col-span-2">
    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
      Mobile Number
    </label>
    <input
      id="mobile"
      type="text"
      name="mobile"
      value={formData.mobile}
      onChange={handleChange}
      className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>

      </>
    ) : (
      <>
        <h2 className="text-2xl font-semibold text-gray-800">Hello, {user?.full_name}</h2>
        <p className="text-gray-600">Email: {user?.email}</p>
        <p className="text-gray-600">Phone: {user?.mobile || "Not added"}</p>
      </>
    )}
  </div>

<div className="flex flex-col md:flex-row gap-2 md:gap-3">
  {isEditing ? (
    <>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded w-full md:w-auto"
        onClick={handleSave}
      >
        Save
      </button>
      <button
        className="px-4 py-2 border rounded w-full md:w-auto"
        onClick={handleCancelEdit}
      >
        Cancel
      </button>
    </>
  ) : (
    <button
      className="flex items-center gap-2 text-blue-600 hover:underline"
      onClick={handleEditToggle}
    >
      <Pencil className="w-4 h-4" />
      <div className="hidden md:block">Edit Profile Info</div>
    </button>
  )}
</div>

</div>

      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link to="/orders" className="flex items-center gap-4 p-5 bg-white rounded-lg shadow hover:shadow-md">
          <Package className="w-6 h-6 text-blue-600" />
          <span className="text-gray-800 font-medium">Your Orders</span>
        </Link>

        <Link to="/cart" className="flex items-center gap-4 p-5 bg-white rounded-lg shadow hover:shadow-md">
          <ShoppingCart className="w-6 h-6 text-green-600" />
          <span className="text-gray-800 font-medium">Your Cart</span>
        </Link>

  <div className="bg-white rounded-lg shadow p-5">
  <button
    onClick={() => setShowPasswordForm((prev) => !prev)}
    className="flex items-center gap-4 w-full"
  >
    <Lock className="w-6 h-6 text-red-500" />
    <span className="text-gray-800 font-medium">Change Password</span>
  </button>

  {showPasswordForm && (
    <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
      <input
        type="password"
        name="currentPassword"
        placeholder="Current Password"
        value={passwordForm.currentPassword}
        onChange={handlePasswordChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="password"
        name="newPassword"
        placeholder="New Password"
        value={passwordForm.newPassword}
        onChange={handlePasswordChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="password"
        name="confirmNewPassword"
        placeholder="Confirm New Password"
        value={passwordForm.confirmNewPassword}
        onChange={handlePasswordChange}
        className="w-full border p-2 rounded"
        required
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Update Password
      </button>
    </form>
  )}
</div>


        <button className="flex items-center gap-4 p-5 bg-white rounded-lg shadow hover:shadow-md"
          onClick={() => navigate('/manage-address')}
        >
          <MapPin className="w-6 h-6 text-yellow-500" />
          <span className="text-gray-800 font-medium">Manage Addresses</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-4 p-5 bg-white rounded-lg shadow hover:shadow-md"
        >
          <LogOut className="w-6 h-6 text-gray-700" />
          <span className="text-gray-800 font-medium">Sign Out</span>
        </button>
      </div>
    </div>
    </>
  );
}
