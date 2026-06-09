import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import Header from "../components/header";

const formatCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="flex animate-pulse gap-4 border border-gray-200 bg-white p-4"
          >
            <div className="h-28 w-28 shrink-0 bg-gray-200 sm:h-32 sm:w-32" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-5 w-3/4 bg-gray-200" />
              <div className="h-4 w-24 bg-gray-200" />
              <div className="h-9 w-28 bg-gray-200" />
              <div className="h-4 w-20 bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-56 animate-pulse border border-gray-200 bg-white p-5">
        <div className="h-6 w-36 bg-gray-200" />
        <div className="mt-6 h-4 w-full bg-gray-200" />
        <div className="mt-4 h-4 w-full bg-gray-200" />
        <div className="mt-6 h-11 w-full bg-gray-200" />
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
      <img
        src="/assets/empty-shopping.webp"
        alt="Empty shopping cart with a delivery box"
        className="h-auto w-full max-w-[290px] object-contain sm:max-w-[340px]"
      />
      <h2 className="mt-2 text-2xl font-bold text-gray-950">
        Your cart is waiting
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 sm:text-base">
        Explore Shopzi and add something you like. Your selected products will
        appear here.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 flex h-11 items-center justify-center gap-2 bg-yellow-400 px-6 text-sm font-bold text-gray-950 hover:bg-yellow-500"
      >
        Continue shopping
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/cart");
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setLoadError("We could not load your cart right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    const currentItem = cartItems.find(
      (item) => item.cart_item_id === cartItemId
    );
    if (!currentItem || newQuantity === currentItem.quantity) return;

    const previousQuantity = currentItem.quantity;
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.cart_item_id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    setUpdatingItems((current) => new Set(current).add(cartItemId));

    try {
      await api.patch(`/cart/${cartItemId}`, { quantity: newQuantity });
    } catch (error) {
      setCartItems((currentItems) =>
        currentItems.map((item) =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: previousQuantity }
            : item
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

  const calculateSubtotal = (item) => Number(item.price) * item.quantity;
  const total = cartItems.reduce(
    (sum, item) => sum + calculateSubtotal(item),
    0
  );
  const itemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const showConfirmToast = (onConfirm) => {
    toast(
      (toastItem) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">Remove this item?</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(toastItem.id)}
              className="h-8 border border-gray-300 px-3 text-xs font-semibold text-gray-700"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastItem.id);
                onConfirm();
              }}
              className="h-8 bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const handleDelete = (cartItemId) => {
    showConfirmToast(async () => {
      try {
        await api.delete(`/cart/${cartItemId}`);
        setCartItems((currentItems) =>
          currentItems.filter((item) => item.cart_item_id !== cartItemId)
        );
        toast.success("Item removed from cart");
      } catch (error) {
        console.error("Failed to delete item:", error);
        toast.error("Failed to remove item");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster
        position="top-center"
        toastOptions={{ style: { marginTop: "88px" } }}
      />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center bg-yellow-400 text-gray-950">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-950">
              Your shopping cart
            </h1>
            {!loading && cartItems.length > 0 && (
              <p className="text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "items"} ready for
                checkout
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <CartSkeleton />
        ) : loadError ? (
          <section className="flex min-h-[55vh] flex-col items-center justify-center text-center">
            <RefreshCw className="h-9 w-9 text-gray-400" />
            <h2 className="mt-4 text-xl font-bold text-gray-950">
              Cart unavailable
            </h2>
            <p className="mt-2 text-sm text-gray-600">{loadError}</p>
            <button
              type="button"
              onClick={fetchCart}
              className="mt-5 flex h-10 items-center gap-2 bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        ) : cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4" aria-label="Cart items">
              {cartItems.map((item) => (
                <article
                  key={item.cart_item_id}
                  className="border border-gray-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="h-44 w-full shrink-0 border border-gray-100 bg-white sm:h-32 sm:w-32"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-contain p-2 transition hover:opacity-80"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Link
                            to={`/product/${item.product_id}`}
                            className="font-semibold text-gray-950 hover:text-blue-700 hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm font-bold text-gray-950">
                            {formatCurrency.format(Number(item.price))}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-950">
                          {formatCurrency.format(calculateSubtotal(item))}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <label
                          htmlFor={`qty-${item.cart_item_id}`}
                          className="text-sm font-medium text-gray-600"
                        >
                          Quantity
                        </label>
                        <select
                          id={`qty-${item.cart_item_id}`}
                          value={item.quantity}
                          disabled={updatingItems.has(item.cart_item_id)}
                          onChange={(event) =>
                            handleQuantityChange(
                              item.cart_item_id,
                              Number(event.target.value)
                            )
                          }
                          className="h-9 border border-gray-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-600 disabled:bg-gray-100"
                        >
                          {Array.from(
                            {
                              length: Math.max(
                                1,
                                Math.min(Number(item.stock) || 20, 20)
                              ),
                            },
                            (_, index) => index + 1
                          ).map((quantity) => (
                              <option key={quantity} value={quantity}>
                                {quantity}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.cart_item_id)}
                          className="flex h-9 items-center gap-1.5 px-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit border border-gray-200 bg-white p-5 lg:sticky lg:top-4">
              <h2 className="text-lg font-bold text-gray-950">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({itemCount})</span>
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
                onClick={() => navigate("/cart-checkout")}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-yellow-400 px-4 text-sm font-bold text-gray-950 hover:bg-yellow-500"
              >
                Proceed to checkout
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                Prices and availability are verified securely at checkout.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
