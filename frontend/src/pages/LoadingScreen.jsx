import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

useEffect(() => {
  const interval = setInterval(() => {
    setProgress((prev) => {
      const next = prev + 1;
      if (next >= 100) {
        clearInterval(interval);
        navigate('/login'); // <-- move this here, inside the `if` block
      }
      return next;
    });
  }, 10);
  return () => clearInterval(interval);
}, []);

  return (
// inside return (...)
<div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-white">
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

  {/* Progress Bar Container */}
  <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
    <div
      className="h-full bg-yellow-500 transition-all duration-200 ease-linear"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>

  );
}
