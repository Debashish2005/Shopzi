import { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Menu } from "lucide-react";
import { Package } from "lucide-react";
import api from '../api/axios'; 
import { useNavigate, useLocation } from "react-router-dom";

export default function Header({ onSearch }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [user, setUser] = useState(null);
   const navigate = useNavigate();
const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me"); // will include cookie
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);
const cartCount = 0;


const [searchTerm, setSearchTerm] = useState("");


const handleSearch = (e) => {
  e.preventDefault();
  const trimmed = searchTerm.trim();

  if (!trimmed) return;

  if (onSearch) {
    onSearch(trimmed); // dashboard page
  } else {
    // other pages like profile/orders/cart
    navigate(`/search?query=${encodeURIComponent(trimmed)}`);
  }
};
  return (
    <header className="bg-[#131921] text-white shadow-md max-w-screen">
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">

        {/* TOP ROW: Logo + Hamburger */}
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-extrabold flex items-baseline text-yellow-400">
            <span className="italic font-serif">S</span>
            <span className="font-mono">hop</span>
            <span className="italic font-serif text-white ml-1">zi</span>
          </Link>

          {/* Hamburger for Mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden text-white"
          >
            <Menu size={28} />
          </button>
        </div>

        {/* SEARCH BAR */}
<div className="w-full sm:flex-grow sm:px-6">
  <form
    onSubmit={handleSearch}
    className="w-full max-w-3xl mx-auto flex rounded overflow-hidden bg-white border border-white"
  >
<input
  type="text"
  placeholder="Search"
  value={searchTerm}
onChange={(e) => {
  const term = e.target.value;
  setSearchTerm(term);
  if (onSearch) {
    onSearch(term); // real-time filtering only for dashboard
  }
}}

  className="w-full px-4 py-2 text-black focus:outline-none text-sm"
/>

    <button
      type="submit"
      className="bg-yellow-400 hover:bg-yellow-500 px-4 flex items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-black"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35m1.08-5.33a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </button>
  </form>
</div>


        {/* DESKTOP MENU */}
        <div className="hidden sm:flex items-center gap-6 shrink-0 w-[260px] justify-end text-sm font-medium">
 <div className="flex flex-col text-right">
  <span className="text-gray-300 truncate max-w-[110px]">
    Hello, {user?.full_name?.split(" ")[0] || "Guest"}
  </span>
  <Link to="/profile" className="text-white hover:underline">
    Account & Lists
  </Link>
</div>

 <div className="flex items-center gap-1 text-white">
      <Package className="w-5 h-5 text-white" />
      <Link to="/orders" className="hover:underline">
        Orders
      </Link>
    </div>
          <Link to="/cart" className="relative flex items-center gap-1 hover:underline">
            <ShoppingCart size={24} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-yellow-500 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#1f2a36] px-4 pb-4 text-sm font-medium space-y-3">
          <div className="border-b border-gray-700 pb-2">
            <span className="text-gray-300 block">Hello, {user?.full_name.split(" ")[0] || "Guest"}</span>
            <Link to="/profile" className="text-white block hover:underline">
              Account & Lists
            </Link>
          </div>
    <div className="flex items-center gap-1 text-white">
      <Package className="w-5 h-5 text-white" />
      <Link to="/orders" className="hover:underline">
        Orders
      </Link>
    </div>
          <Link to="/cart" className="relative flex items-center gap-2 text-white hover:underline">
            <ShoppingCart size={20} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-3 bg-yellow-500 text-black text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      )}
    </header>
  );
}
