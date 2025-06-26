import { useEffect, useState } from "react";
import { useParams,useLocation } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import ProductCard from "../components/ProductCard";
import api from "../api/axios";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";



export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation(); 
  const navigate = useNavigate();


useEffect(() => {
  setProduct(null); // optional loading state
  api.get(`/product/${id}`)
    .then(res => setProduct(res.data.product))
    .catch(err => console.error("Failed to load product", err));
}, [id]); // this alone is enough



  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setSearchResults([]); // show dummy items
        return;
      }

      // Fetch from /products?search=
      api.get(`/products?search=${searchTerm.trim()}`)
        .then(res => {
          setSearchResults(res.data.products);
        })
        .catch(err => {
          console.error("Search failed", err);
        });
    }, 300); // wait for user to stop typing

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  if (!product) return <p className="p-4 text-center">Loading...</p>;

async function handleAddToCart() {
  try {
    const res = await api.post(
      "/add-to-cart",
      {
        product_id: product.id,
        quantity: 1,
      },
      { withCredentials: true }
    );

    toast.success(res.data.message || "Added to cart", {
      duration: 3000,
    });
  } catch (err) {
    if (err.response) {
      console.error("Server error:", err.response.data);
      toast.error(err.response.data.error || "Server error", {
        duration: 3000,
      });
    } else if (err.request) {
      console.error("No response received:", err.request);
      toast.error("Server not responding", {
        duration: 3000,
      });
    } else {
      console.error("Error setting up request:", err.message);
      toast.error("Unexpected error", {
        duration: 3000,
      });
    }
  }
}

  const handleBuyNow = () => {
    navigate("/place-order", { state: { product } });
  };

  return (
    <>
    <Toaster
  position="top-center"
  toastOptions={{
    style: {
      marginTop: "100px",
    },
  }}
/>
    <Header onSearch={handleSearch} />

{searchTerm ? (
  // Show search results and HIDE product detail
  searchResults.length > 0 ? (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

{searchResults.map(p => (
  <ProductCard
    key={p.id}
    product={{
      ...p,
      price: Number(p.price),
      original_price: p.original_price ? Number(p.original_price) : undefined,
      image_url: p.image_url || p.images?.[0],
      rating: p.rating || 4,
      reviews: p.reviews || 123,
      is_prime: p.is_prime || false,
      stock: p.stock || 0,
    }}
  />
))}

    </div>
  ) : (
    <div className="flex justify-center items-center h-32 text-gray-500 text-lg">
      No products found for "{searchTerm}"
    </div>
  )
) : (
  // Show product detail ONLY if no search is active
  <div className="p-6 max-w-6xl mx-auto bg-white shadow rounded grid grid-cols-1 lg:grid-cols-2 gap-10">
    {/* Image Gallery */}
    <Swiper
      modules={[Navigation]}
      navigation
      spaceBetween={10}
      slidesPerView={1}
      className="max-w-full"
    >
      {product.images.map((url, i) => (
        <SwiperSlide key={i}>
          <img
            src={url}
            alt={`Product image ${i + 1}`}
            className="w-full max-h-[400px] object-contain border p-2 bg-gray-50 rounded"
          />
        </SwiperSlide>
      ))}
    </Swiper>

    {/* Product Info */}
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <div className="flex items-center gap-2 text-yellow-500">
        <span className="font-semibold">{product.rating} ★</span>
        <span className="text-gray-600 text-sm">({product.reviews} reviews)</span>
      </div>
      <div className="text-xl font-bold text-black">
        ₹{Number(product.price).toFixed(2)}
        {product.original_price && product.original_price > product.price && (
          <span className="ml-2 line-through text-gray-500 text-base">
            ₹{Number(product.original_price).toFixed(2)}
          </span>
        )}
      </div>
      <p className="text-gray-700">{product.description}</p>
      <p className="text-sm text-gray-500">Category: {product.category}</p>
      <p className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
      </p>
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleAddToCart}
          className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-6 rounded disabled:opacity-50"
          disabled={product.stock === 0}
        >
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-6 rounded disabled:opacity-50"
          disabled={product.stock === 0}
        >
          Buy Now
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
}
