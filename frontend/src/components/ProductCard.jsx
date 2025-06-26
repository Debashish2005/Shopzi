import { Star, StarHalf, StarOff } from "lucide-react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import toast, { Toaster } from "react-hot-toast";

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  const {
    id,
    name,
    description,
    price,
    original_price,
    image_url,
    rating,
    reviews,
    is_prime,
    stock,
    dummy = false, // Default false if not provided
  } = product;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarHalf key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />);
      } else {
        stars.push(<StarOff key={i} className="w-4 h-4 text-gray-400" />);
      }
    }

    return stars;
  };

  async function handleAddToCart() {
    if (dummy) {
      toast("This is a demo item.", { icon: "🧸" });
      return;
    }

    try {
      const res = await axios.post(
        "/add-to-cart",
        { product_id: id, quantity: 1 },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Added to cart", { duration: 3000 });
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data.error || "Server error");
      } else if (err.request) {
        toast.error("Server not responding");
      } else {
        toast.error("Unexpected error");
      }
    }
  }

  const handleView = () => {
    if (dummy) {
      toast("This is just a sample product.", { icon: "📦" });
    } else {
      navigate(`/product/${id}`);
    }
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { marginTop: "100px" } }} />

      <div className="w-full border rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-300 bg-white">
        <img
          src={image_url}
          alt={name}
          className="w-full h-48 object-contain p-4 bg-gray-50"
        />

        <div className="p-4">
          <h2 className="text-sm font-semibold line-clamp-2 h-[3em]">{name}</h2>

          <div className="flex items-center gap-1 mt-1">
            {renderStars()}
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>

          <div className="mt-2">
            <span className="text-lg font-bold text-black">
              ₹{Number(price).toFixed(2)}
            </span>
            {original_price && Number(original_price) > Number(price) && (
              <span className="text-sm text-gray-500 line-through ml-2">
                ₹{Number(original_price).toFixed(2)}
              </span>
            )}
          </div>

          <p
            className={clsx(
              "text-sm mt-1",
              stock > 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {stock > 0 ? "In stock" : "Out of stock"}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-1 rounded text-sm"
              disabled={stock === 0}
            >
              Add to Cart
            </button>

            <button
              onClick={handleView}
              className="flex-1 border text-sm py-1 rounded"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
