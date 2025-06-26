import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Header from "../components/header";


export default function CartCheckoutPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cartItems, setCartItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAddresses();
    fetchCart();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get("/addresses", { withCredentials: true });
      setAddresses(res.data.addresses);
      if (res.data.addresses.length > 0) {
        setSelectedAddressId(res.data.addresses[0].id);
      }
    } catch (err) {
      console.error("Failed to load addresses", err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await axios.get("/cart", { withCredentials: true });
      setCartItems(res.data.items);
    } catch (err) {
      console.error("Failed to load cart", err);
    }
  };

  const calculateTotal = () =>
    cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || cartItems.length === 0) {
      alert("Please select an address and ensure cart is not empty.");
      return;
    }

    const items = cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: Number(item.price),
    }));

    try {
      setPlacingOrder(true);
      const res = await axios.post(
        "/place-order",
        {
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          items,
        },
        { withCredentials: true }
      );
      alert(res.data.message);
      navigate("/orders");
    } catch (err) {
      console.error("Order failed", err);
 toast.success(res.data.message || "Order placed successfully!", {
  icon: "✅",
  duration: 4000,
});

    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
    <Toaster position="top-center" toastOptions={{ style: { marginTop: "100px" } }} />
    <Header/>
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Checkout Your Cart</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Delivery Address</h2>
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className="block border rounded p-3 mb-2 cursor-pointer hover:border-blue-500"
          >
            <input
              type="radio"
              name="address"
              value={addr.id}
              checked={selectedAddressId === addr.id}
              onChange={() => setSelectedAddressId(addr.id)}
              className="mr-2"
            />
            {addr.name}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
          </label>
        ))}
        {addresses.length === 0 && <p>No addresses saved.</p>}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Payment Method</h2>
        <label className="block mb-2">
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
            className="mr-2"
          />
          Cash on Delivery
        </label>
        <label className="block mb-2">
          <input
            type="radio"
            name="payment"
            value="Card"
            checked={paymentMethod === "Card"}
            onChange={() => setPaymentMethod("Card")}
            className="mr-2"
          />
          Debit/Credit Card
        </label>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
{cartItems.map((item, index) => (
  <div
    key={item.cart_item_id}
    className="flex justify-between border-b py-2"
  >
    <div className="flex gap-2 items-center">
      <span>{item.name}</span>

      {/* Quantity Control */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            const updated = [...cartItems];
            updated[index].quantity = Math.max(1, updated[index].quantity - 1);
            setCartItems(updated);
          }}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l bg-gray-100 hover:bg-gray-200 text-lg font-semibold"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => {
            const updated = [...cartItems];
            updated[index].quantity = Math.max(1, parseInt(e.target.value) || 1);
            setCartItems(updated);
          }}
          className="w-12 h-8 text-center border-t border-b border-gray-300 focus:outline-none"
        />
        <button
          onClick={() => {
            const updated = [...cartItems];
            updated[index].quantity += 1;
            setCartItems(updated);
          }}
          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r bg-gray-100 hover:bg-gray-200 text-lg font-semibold"
        >
          +
        </button>
      </div>
    </div>

    <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
  </div>
))}

        <div className="mt-3 font-semibold flex justify-between">
          <span>Total</span>
          <span>₹{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <button
        disabled={placingOrder}
        onClick={handlePlaceOrder}
        className="w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded font-semibold"
      >
        {placingOrder ? "Placing Order..." : "Place Order"}
      </button>
    </div>
    </>
  );
}
