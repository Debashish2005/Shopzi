import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Banknote,
  Check,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import Header from "../components/header";
import { openRazorpayCheckout } from "../utils/razorpay";

const formatCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export default function PlaceOrderPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [quantity, setQuantity] = useState(1);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  useEffect(() => {
    if (!product) {
      toast.error("Select a product before opening checkout.");
      navigate("/dashboard", { replace: true });
      return;
    }

    async function fetchAddresses() {
      try {
        const response = await api.get("/addresses");
        const savedAddresses = response.data.addresses || [];
        setAddresses(savedAddresses);
        setSelectedAddressId(savedAddresses[0]?.id || null);
      } catch (error) {
        console.error("Failed to load addresses", error);
        toast.error("Could not load your delivery addresses.");
      } finally {
        setLoadingAddresses(false);
      }
    }

    fetchAddresses();
  }, [navigate, product]);

  const total = useMemo(
    () => (product ? Number(product.price) * quantity : 0),
    [product, quantity]
  );

  const cancelPendingPayment = async (orderId, reason) => {
    try {
      await api.post("/payments/cancel", {
        shopzi_order_id: orderId,
        reason,
      });
    } catch (error) {
      console.error("Could not cancel pending payment", error);
    }
  };

  const placeCodOrder = async (item) => {
    const response = await api.post("/place-order", {
      address_id: selectedAddressId,
      payment_method: "COD",
      source: "buy_now",
      items: [item],
    });

    toast.success(response.data.message);
    navigate("/orders");
  };

  const placeRazorpayOrder = async (item) => {
    const createResponse = await api.post("/payments/create-order", {
      address_id: selectedAddressId,
      source: "buy_now",
      items: [item],
    });
    const paymentOrder = createResponse.data;

    let checkoutResponse;

    try {
      checkoutResponse = await openRazorpayCheckout({
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Shopzi",
        description: product.name,
        order_id: paymentOrder.razorpay_order_id,
        prefill: paymentOrder.prefill,
        notes: {
          shopzi_order_id: String(paymentOrder.shopzi_order_id),
        },
        theme: {
          color: "#eab308",
        },
      });
    } catch (error) {
      await cancelPendingPayment(
        paymentOrder.shopzi_order_id,
        error.message || "Payment was cancelled."
      );
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
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !product) {
      toast.error("Select a delivery address before continuing.");
      return;
    }

    const item = {
      product_id: product.id,
      quantity,
    };

    try {
      setPlacingOrder(true);

      if (paymentMethod === "COD") {
        await placeCodOrder(item);
      } else {
        await placeRazorpayOrder(item);
      }
    } catch (error) {
      console.error("Order failed", error);

      if (error.code === "CHECKOUT_CLOSED") {
        toast("Payment cancelled. No money was charged.");
      } else if (error.code === "PAYMENT_FAILED") {
        toast.error(error.message);
      } else {
        toast.error(
          error.response?.data?.message ||
            "Could not complete your order. Please try again."
        );
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!product) return null;

  const imageUrl = product.images?.[0] || product.image_url;
  const isRazorpay = paymentMethod === "Razorpay";

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{ style: { marginTop: "88px" } }}
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">Secure checkout</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Place your order
          </h1>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-10">
            <section>
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-950">
                  Delivery address
                </h2>
              </div>

              {loadingAddresses ? (
                <p className="text-sm text-gray-500">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <div className="border border-gray-300 p-4">
                  <p className="text-sm text-gray-700">
                    Add a delivery address before placing your order.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/manage-address")}
                    className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Add an address
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => {
                    const selected = selectedAddressId === address.id;

                    return (
                      <label
                        key={address.id}
                        className={`flex cursor-pointer gap-3 border p-4 transition ${
                          selected
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300 bg-white hover:border-gray-500"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selected}
                          onChange={() => setSelectedAddressId(address.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <span className="min-w-0 text-sm leading-6 text-gray-800">
                          <span className="block font-semibold text-gray-950">
                            {address.name}
                          </span>
                          {address.street}, {address.city}, {address.state} -{" "}
                          {address.pincode}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-950">
                  Payment method
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer border p-4 transition ${
                    paymentMethod === "COD"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 h-4 w-4"
                    />
                    <Banknote className="h-5 w-5 text-gray-700" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-950">
                        Cash on Delivery
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-gray-600">
                        Pay when your order arrives.
                      </span>
                    </span>
                  </div>
                </label>

                <label
                  className={`cursor-pointer border p-4 transition ${
                    isRazorpay
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="Razorpay"
                      checked={isRazorpay}
                      onChange={() => setPaymentMethod("Razorpay")}
                      className="mt-1 h-4 w-4"
                    />
                    <CreditCard className="h-5 w-5 text-gray-700" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-950">
                        Pay Online with Razorpay
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-gray-600">
                        UPI, cards, netbanking and wallets.
                      </span>
                    </span>
                  </div>
                </label>
              </div>

              {isRazorpay && (
                <div className="mt-3 flex items-center gap-2 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  Test Mode is enabled. No real money will be charged.
                </div>
              )}
            </section>
          </div>

          <aside className="border border-gray-300 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-gray-950">Order summary</h2>

            <div className="mt-5 flex gap-4 border-b border-gray-200 pb-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden border border-gray-200 bg-gray-50">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-gray-950">
                  {product.name}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {formatCurrency.format(Number(product.price))}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 py-5">
              <span className="text-sm font-medium text-gray-700">Quantity</span>
              <div className="flex h-9 items-center border border-gray-300">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="flex h-full w-9 items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  disabled={quantity === 1 || placingOrder}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  max={Math.min(Number(product.stock) || 20, 20)}
                  value={quantity}
                  disabled={placingOrder}
                  onChange={(event) => {
                    const nextQuantity = Number.parseInt(event.target.value, 10);
                    const maximum = Math.min(Number(product.stock) || 20, 20);
                    setQuantity(Math.min(Math.max(nextQuantity || 1, 1), maximum));
                  }}
                  className="h-full w-12 border-x border-gray-300 text-center text-sm outline-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(current + 1, Number(product.stock) || 20, 20)
                    )
                  }
                  className="flex h-full w-9 items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40"
                  disabled={
                    placingOrder ||
                    quantity >= Math.min(Number(product.stock) || 20, 20)
                  }
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 py-5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency.format(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="font-medium text-green-700">Free</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-950">
                <span>Total</span>
                <span>{formatCurrency.format(total)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={
                placingOrder ||
                loadingAddresses ||
                addresses.length === 0 ||
                !selectedAddressId
              }
              onClick={handlePlaceOrder}
              className="flex h-11 w-full items-center justify-center gap-2 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {placingOrder ? (
                "Processing..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isRazorpay
                    ? `Pay ${formatCurrency.format(total)}`
                    : "Place COD order"}
                </>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Prices and stock are verified securely on the server.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
