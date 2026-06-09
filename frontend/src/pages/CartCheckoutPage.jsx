import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import Header from "../components/header";
import { openRazorpayCheckout } from "../utils/razorpay";

const formatCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export default function CartCheckoutPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cartItems, setCartItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCheckout() {
      try {
        const [addressResponse, cartResponse] = await Promise.all([
          api.get("/addresses"),
          api.get("/cart"),
        ]);
        const savedAddresses = addressResponse.data.addresses || [];
        setAddresses(savedAddresses);
        setSelectedAddressId(savedAddresses[0]?.id || null);
        setCartItems(cartResponse.data.items || []);
      } catch (error) {
        console.error("Failed to load checkout", error);
        toast.error("Could not load your checkout.");
      }
    }

    loadCheckout();
  }, []);

  const calculateTotal = () =>
    cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

  const updateQuantity = (index, nextQuantity) => {
    setCartItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: Math.max(1, nextQuantity) }
          : item
      )
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || cartItems.length === 0) {
      toast.error("Select an address and make sure your cart is not empty.");
      return;
    }

    const items = cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    try {
      setPlacingOrder(true);

      if (paymentMethod === "COD") {
        const response = await api.post("/place-order", {
          address_id: selectedAddressId,
          payment_method: "COD",
          source: "cart",
          items,
        });
        toast.success(response.data.message);
        navigate("/orders");
        return;
      }

      const createResponse = await api.post("/payments/create-order", {
        address_id: selectedAddressId,
        source: "cart",
        items,
      });
      const paymentOrder = createResponse.data;

      let checkoutResponse;

      try {
        checkoutResponse = await openRazorpayCheckout({
          key: paymentOrder.key_id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: "Shopzi",
          description: "Cart checkout",
          order_id: paymentOrder.razorpay_order_id,
          prefill: paymentOrder.prefill,
          theme: { color: "#16a34a" },
        });
      } catch (error) {
        try {
          await api.post("/payments/cancel", {
            shopzi_order_id: paymentOrder.shopzi_order_id,
            reason: error.message || "Payment was cancelled.",
          });
        } catch (cancelError) {
          console.error("Could not cancel pending payment", cancelError);
        }
        throw error;
      }

      const verifyResponse = await api.post("/payments/verify", {
        shopzi_order_id: paymentOrder.shopzi_order_id,
        razorpay_order_id: checkoutResponse.razorpay_order_id,
        razorpay_payment_id: checkoutResponse.razorpay_payment_id,
        razorpay_signature: checkoutResponse.razorpay_signature,
      });

      toast.success(verifyResponse.data.message);
      navigate("/orders");
    } catch (error) {
      console.error("Order failed", error);

      if (error.code === "CHECKOUT_CLOSED") {
        toast("Payment cancelled. No money was charged.");
      } else {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Could not complete the order."
        );
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{ style: { marginTop: "100px" } }}
      />
      <Header />
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-semibold">Checkout your cart</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Delivery address</h2>
          <div className="space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`block cursor-pointer border p-3 ${
                  selectedAddressId === address.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                  className="mr-2"
                />
                {address.name}, {address.street}, {address.city}, {address.state} -{" "}
                {address.pincode}
              </label>
            ))}
          </div>
          {addresses.length === 0 && <p>No addresses saved.</p>}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Payment method</h2>
          <label className="mb-2 block">
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
          <label className="block">
            <input
              type="radio"
              name="payment"
              value="Razorpay"
              checked={paymentMethod === "Razorpay"}
              onChange={() => setPaymentMethod("Razorpay")}
              className="mr-2"
            />
            Pay Online with Razorpay (Test Mode)
          </label>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Order summary</h2>
          {cartItems.map((item, index) => (
            <div
              key={item.cart_item_id}
              className="flex items-center justify-between border-b py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="truncate">{item.name}</span>
                <div className="flex h-8 items-center border border-gray-300">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className="h-full w-8 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(
                        index,
                        Number.parseInt(event.target.value, 10) || 1
                      )
                    }
                    className="h-full w-12 border-x border-gray-300 text-center outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="h-full w-8 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <span>
                {formatCurrency.format(Number(item.price) * item.quantity)}
              </span>
            </div>
          ))}

          <div className="mt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency.format(calculateTotal())}</span>
          </div>
        </section>

        <button
          type="button"
          disabled={
            placingOrder || !selectedAddressId || cartItems.length === 0
          }
          onClick={handlePlaceOrder}
          className="w-full bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
        >
          {placingOrder
            ? "Processing..."
            : paymentMethod === "Razorpay"
              ? "Pay securely"
              : "Place COD order"}
        </button>
      </main>
    </>
  );
}
