import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Header from "../components/header";

export default function PlaceOrderPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [quantity, setQuantity] = useState(1);
  const [placingOrder, setPlacingOrder] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  useEffect(() => {
    if (!product) {
      alert("No product selected for direct purchase.");
      navigate(-1); // Go back
      return;
    }

    fetchAddresses();
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

  const calculateTotal = () =>
    product ? Number(product.price) * quantity : 0;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !product) {
      alert("Please select an address.");
      return;
    }

    const item = {
      product_id: product.id,
      quantity,
      price: Number(product.price),
    };

    try {
      setPlacingOrder(true);
      const res = await axios.post(
        "/place-order",
        {
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          items: [item],
        },
        { withCredentials: true }
      );
      alert(res.data.message);
      navigate("/orders");
    } catch (err) {
      console.error("Order failed", err);
      alert(
        err.response?.data?.message ||
          "Something went wrong while placing the order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
    <Header/>
        <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Place Your Order</h1>

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
            {addr.name}, {addr.street}, {addr.city}, {addr.state} -{" "}
            {addr.pincode}
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
        <div className="flex justify-between border-b py-2">
          <div className="flex gap-2 items-center">
            <span>{product?.name}</span>
<div className="flex items-center gap-1">
  <button
    onClick={() => setQuantity(q => Math.max(1, q - 1))}
    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l bg-gray-100 hover:bg-gray-200 text-lg font-semibold"
  >
    −
  </button>
  <input
    type="number"
    min="1"
    value={quantity}
    onChange={(e) =>
      setQuantity(parseInt(e.target.value) || 1)
    }
    className="w-12 h-8 text-center border-t border-b border-gray-300 focus:outline-none"
  />
  <button
    onClick={() => setQuantity(q => q + 1)}
    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r bg-gray-100 hover:bg-gray-200 text-lg font-semibold"
  >
    +
  </button>
</div>

          </div>
          <span>₹{(Number(product?.price) * quantity).toFixed(2)}</span>
        </div>
        <div className="mt-3 font-semibold flex justify-between">
          <span>Total</span>
          <span>₹{calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <button
        disabled={placingOrder}
        onClick={handlePlaceOrder}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded font-semibold"
      >
        {placingOrder ? "Placing Order..." : "Place Order"}
      </button>
    </div>
    </>
  );
}
