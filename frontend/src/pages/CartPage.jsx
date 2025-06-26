import { useEffect, useState } from "react";
import axios from "../api/axios";
import {Link,useNavigate} from "react-router-dom";
import Header from "../components/header";
import toast, { Toaster } from "react-hot-toast";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get("/cart");
      setCartItems(res.data.items);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (cartItemId, newQuantity) => {
    const updated = cartItems.map((item) =>
      item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updated);
  };

  const calculateSubtotal = (item) => Number(item.price) * item.quantity;
  const calculateTotal = () =>
    cartItems.reduce((sum, item) => sum + calculateSubtotal(item), 0);

  if (loading) return <div className="p-6">Loading...</div>;
  const showConfirmToast = (onConfirm) => {
  toast((t) => (
    <span className="text-sm">
      Are you sure you want to remove this item?
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm(); // trigger deletion
          }}
          className="px-3 py-1 text-white bg-red-600 rounded text-xs"
        >
          Yes
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="px-3 py-1 border rounded text-xs"
        >
          No
        </button>
      </div>
    </span>
  ), { duration: 8000 });
};

const handleDelete = async (cartItemId) => {
  showConfirmToast(async () => {
    try {
      await axios.delete(`/cart/${cartItemId}`);
      setCartItems((prev) =>
        prev.filter((item) => item.cart_item_id !== cartItemId)
      );
    
    } catch (err) {
      console.error("Failed to delete item:", err);
      toast.error("Failed to remove item");
    }
  });
};


  return (
    <>
    <Toaster
  position="top-center"
  toastOptions={{
    style: {
      marginTop: '100px',
    },
  }}
/>

    <Header/>
        <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Your Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div>Your cart is empty.</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left section: Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div
                key={item.cart_item_id}
                className="flex gap-4 border p-4 rounded-lg shadow-sm bg-white"
              >
            <Link to={`/product/${item.product_id}`}>
  <img
    src={item.image_url}
    alt={item.name}
    className="w-32 h-32 object-cover rounded-md hover:opacity-80 transition"
  />
</Link>

              <div className="flex-grow">
  <h2 className="text-lg font-semibold">{item.name}</h2>
  <p className="text-gray-600">₹{Number(item.price).toFixed(2)}</p>

  <div className="mt-2 flex items-center gap-2">
    <label htmlFor={`qty-${item.cart_item_id}`}>Qty:</label>
    <select
      id={`qty-${item.cart_item_id}`}
      value={item.quantity}
      onChange={(e) =>
        handleQuantityChange(item.cart_item_id, parseInt(e.target.value))
      }
      className="border rounded px-2 py-1"
    >
      {[...Array(10)].map((_, i) => (
        <option key={i + 1} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  </div>

  <div className="mt-1 text-sm text-gray-700">
    Subtotal: ₹{(Number(item.price) * item.quantity).toFixed(2)}
  </div>

  {/* ✅ DELETE BUTTON */}
  <button
    onClick={() => handleDelete(item.cart_item_id)}
    className="mt-2 text-red-500 hover:underline text-sm"
  >
    Remove
  </button>
</div>

              </div>
            ))}
          </div>

          {/* Right section: Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Items ({cartItems.length}):</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 font-semibold flex justify-between">
              <span>Total:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
    <button
  className="mt-4 w-full bg-yellow-500 hover:bg-yellow-400 text-black py-2 px-4 rounded font-semibold"
  onClick={() => navigate("/cart-checkout")}
>
  Proceed to Checkout
</button>

          </div>
        </div>
      )}
    </div>
    </>
  );
}
