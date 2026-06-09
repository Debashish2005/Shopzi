import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Check,
  CreditCard,
  LoaderCircle,
  MapPin,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import Header from "../components/header";
import { openRazorpayCheckout } from "../utils/razorpay";

const formatCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function CheckoutSkeleton() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-8">
        <div>
          <div className="h-6 w-44 bg-gray-200" />
          <div className="mt-4 h-24 w-full bg-gray-200" />
        </div>
        <div>
          <div className="h-6 w-40 bg-gray-200" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-28 bg-gray-200" />
            <div className="h-28 bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="h-96 border border-gray-200 bg-white p-5">
        <div className="h-6 w-36 bg-gray-200" />
        <div className="mt-5 h-20 w-full bg-gray-200" />
        <div className="mt-4 h-20 w-full bg-gray-200" />
        <div className="mt-6 h-11 w-full bg-gray-200" />
      </div>
    </div>
  );
}

export default function CartCheckoutPage() {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cartItems, setCartItems] = useState([]);
  const [loadingCheckout, setLoadingCheckout] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const navigate = useNavigate();

  const loadCheckout = async () => {
    setLoadingCheckout(true);
    setLoadError("");

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
      setLoadError("We could not load your checkout right now.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  useEffect(() => {
    loadCheckout();
  }, []);

  const total = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
    [cartItems]
  );

  const itemCount = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const updateQuantity = async (cartItemId, nextQuantity) => {
    const item = cartItems.find(
      (cartItem) => cartItem.cart_item_id === cartItemId
    );
    if (!item) return;

    const maximum = Math.max(1, Math.min(Number(item.stock) || 20, 20));
    const quantity = Math.min(Math.max(nextQuantity, 1), maximum);
    if (quantity === item.quantity) return;

    const previousQuantity = item.quantity;
    setCartItems((current) =>
      current.map((cartItem) =>
        cartItem.cart_item_id === cartItemId
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
    setUpdatingItems((current) => new Set(current).add(cartItemId));

    try {
      await api.patch(`/cart/${cartItemId}`, { quantity });
    } catch (error) {
      setCartItems((current) =>
        current.map((cartItem) =>
          cartItem.cart_item_id === cartItemId
            ? { ...cartItem, quantity: previousQuantity }
            : cartItem
        )
      );
      toast.error(
        error.response?.data?.error || "Could not update the quantity"
      );
    } finally {
      setUpdatingItems((current) => {
        const next = new Set(current);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || cartItems.length === 0) {
      toast.error("Select an address and make sure your cart is not empty.");
      return;
    }

    if (updatingItems.size > 0) {
      toast("Wait for quantity changes to finish saving.");
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
          description: `${itemCount} cart item${itemCount === 1 ? "" : "s"}`,
          order_id: paymentOrder.razorpay_order_id,
          prefill: paymentOrder.prefill,
          notes: {
            shopzi_order_id: String(paymentOrder.shopzi_order_id),
          },
          theme: { color: "#eab308" },
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

  const isRazorpay = paymentMethod === "Razorpay";
  const controlsDisabled = placingOrder || updatingItems.size > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster
        position="top-center"
        toastOptions={{ style: { marginTop: "88px" } }}
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </button>

        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-700">Secure checkout</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">
            Checkout your cart
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Confirm delivery, payment and quantities before placing the order.
          </p>
        </div>

        {loadingCheckout ? (
          <CheckoutSkeleton />
        ) : loadError ? (
          <section className="border border-gray-300 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-gray-950">
              Checkout unavailable
            </h2>
            <p className="mt-2 text-sm text-gray-600">{loadError}</p>
            <button
              type="button"
              onClick={loadCheckout}
              className="mt-5 h-10 bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </section>
        ) : cartItems.length === 0 ? (
          <section className="flex min-h-[55vh] flex-col items-center justify-center border border-gray-300 bg-white p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-gray-400" />
            <h2 className="mt-4 text-xl font-bold text-gray-950">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Add products before opening checkout.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mt-5 h-10 bg-yellow-400 px-5 text-sm font-bold text-gray-950 hover:bg-yellow-500"
            >
              Continue shopping
            </button>
          </section>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-9">
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-700" />
                  <h2 className="text-lg font-bold text-gray-950">
                    Delivery address
                  </h2>
                </div>

                {addresses.length === 0 ? (
                  <div className="border border-gray-300 bg-white p-4">
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
                          className={`flex cursor-pointer gap-3 border bg-white p-4 transition ${
                            selected
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:border-gray-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selected}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <span className="min-w-0 text-sm leading-6 text-gray-800">
                            <span className="block font-bold text-gray-950">
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
                  <h2 className="text-lg font-bold text-gray-950">
                    Payment method
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`cursor-pointer border bg-white p-4 transition ${
                      paymentMethod === "COD"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="mt-1 h-4 w-4"
                      />
                      <Banknote className="h-5 w-5 text-gray-700" />
                      <span>
                        <span className="block text-sm font-bold text-gray-950">
                          Cash on Delivery
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-gray-600">
                          Pay when your order arrives.
                        </span>
                      </span>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer border bg-white p-4 transition ${
                      isRazorpay
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={isRazorpay}
                        onChange={() => setPaymentMethod("Razorpay")}
                        className="mt-1 h-4 w-4"
                      />
                      <CreditCard className="h-5 w-5 text-gray-700" />
                      <span>
                        <span className="block text-sm font-bold text-gray-950">
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-950">
                  Order summary
                </h2>
                <span className="text-xs font-semibold text-gray-500">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="mt-4 max-h-[390px] divide-y divide-gray-200 overflow-y-auto pr-1">
                {cartItems.map((item) => {
                  const maximum = Math.max(
                    1,
                    Math.min(Number(item.stock) || 20, 20)
                  );
                  const updating = updatingItems.has(item.cart_item_id);

                  return (
                    <div key={item.cart_item_id} className="py-4 first:pt-0">
                      <div className="flex gap-3">
                        <div className="h-16 w-16 shrink-0 border border-gray-200 bg-gray-50">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-gray-400">
                              <Package className="h-6 w-6" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-5 text-gray-950">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {formatCurrency.format(Number(item.price))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex h-8 items-center border border-gray-300">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.name} quantity`}
                            disabled={
                              controlsDisabled || updating || item.quantity <= 1
                            }
                            onClick={() =>
                              updateQuantity(
                                item.cart_item_id,
                                item.quantity - 1
                              )
                            }
                            className="grid h-full w-8 place-items-center hover:bg-gray-100 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="grid h-full min-w-10 place-items-center border-x border-gray-300 px-2 text-sm font-semibold">
                            {updating ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.name} quantity`}
                            disabled={
                              controlsDisabled ||
                              updating ||
                              item.quantity >= maximum
                            }
                            onClick={() =>
                              updateQuantity(
                                item.cart_item_id,
                                item.quantity + 1
                              )
                            }
                            className="grid h-full w-8 place-items-center hover:bg-gray-100 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-gray-950">
                          {formatCurrency.format(
                            Number(item.price) * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency.format(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-emerald-700">Free</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-950">
                  <span>Total</span>
                  <span>{formatCurrency.format(total)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  controlsDisabled ||
                  addresses.length === 0 ||
                  !selectedAddressId
                }
                onClick={handlePlaceOrder}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {placingOrder ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {isRazorpay
                      ? `Pay ${formatCurrency.format(total)}`
                      : "Place COD order"}
                  </>
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-gray-500">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Prices, stock and payment are verified securely.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
