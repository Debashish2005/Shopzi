import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../api/axios";
import Header from "../components/header";

const formatCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const formatDate = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function OrdersSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2].map((order) => (
        <div
          key={order}
          className="animate-pulse border border-gray-200 bg-white"
        >
          <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-between">
            <div className="space-y-2">
              <div className="h-5 w-28 bg-gray-200" />
              <div className="h-4 w-48 bg-gray-200" />
            </div>
            <div className="h-8 w-24 bg-gray-200" />
          </div>
          <div className="flex gap-4 p-4">
            <div className="h-20 w-20 shrink-0 bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 bg-gray-200" />
              <div className="h-4 w-24 bg-gray-200" />
              <div className="h-4 w-32 bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyOrders() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
      <img
        src="/assets/empty-shopping.webp"
        alt="Shopping cart and delivery package"
        className="h-auto w-full max-w-[290px] object-contain sm:max-w-[340px]"
      />
      <h2 className="mt-2 text-2xl font-bold text-gray-950">No orders yet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-gray-600 sm:text-base">
        When you place an order, its payment and delivery progress will appear
        here.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 flex h-11 items-center justify-center gap-2 bg-yellow-400 px-6 text-sm font-bold text-gray-950 hover:bg-yellow-500"
      >
        Start shopping
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function OrderStatus({ status }) {
  const styles = {
    Placed: "border-blue-200 bg-blue-50 text-blue-700",
    Packed: "border-violet-200 bg-violet-50 text-violet-700",
    Shipped: "border-amber-200 bg-amber-50 text-amber-800",
    Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex border px-2.5 py-1 text-xs font-bold ${
        styles[status] || "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/orders");
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
      setLoadError("We could not load your orders right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showCancelToast = (onConfirm) => {
    toast(
      (toastItem) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">Cancel this order?</p>
          <p className="mt-1 text-xs text-gray-500">
            Reserved stock will be returned.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(toastItem.id)}
              className="h-8 border border-gray-300 px-3 text-xs font-semibold text-gray-700"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastItem.id);
                onConfirm();
              }}
              className="h-8 bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
            >
              Cancel order
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const cancelOrder = (orderId) => {
    showCancelToast(async () => {
      try {
        const response = await api.delete(`/orders/${orderId}`);
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? { ...order, status: "Cancelled" } : order
          )
        );
        toast.success(response.data.message || "Order cancelled successfully");
      } catch (error) {
        console.error("Cancel failed", error);
        toast.error(
          error.response?.data?.message || "Failed to cancel order"
        );
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
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-950">Your orders</h1>
            {!loading && orders.length > 0 && (
              <p className="text-sm text-gray-500">
                Track payments, delivery status and order details
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <OrdersSkeleton />
        ) : loadError ? (
          <section className="flex min-h-[55vh] flex-col items-center justify-center text-center">
            <RefreshCw className="h-9 w-9 text-gray-400" />
            <h2 className="mt-4 text-xl font-bold text-gray-950">
              Orders unavailable
            </h2>
            <p className="mt-2 text-sm text-gray-600">{loadError}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="mt-5 flex h-10 items-center gap-2 bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        ) : orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <section className="space-y-5" aria-label="Order history">
            {orders.map((order) => {
              const canCancel =
                order.status === "Placed" &&
                !(
                  order.payment_method === "Razorpay" &&
                  order.payment_status === "Paid"
                );

              return (
                <article
                  key={order.id}
                  className="overflow-hidden border border-gray-200 bg-white"
                >
                  <header className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div>
                        <p className="font-bold text-gray-950">
                          Order #{order.id}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {order.created_at
                            ? formatDate.format(new Date(order.created_at))
                            : "Date unavailable"}
                        </p>
                      </div>
                      <OrderStatus status={order.status} />
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => cancelOrder(order.id)}
                        className="flex h-9 w-fit items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel order
                      </button>
                    )}
                  </header>

                  <div className="grid gap-4 border-b border-gray-200 px-4 py-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Payment
                      </p>
                      <p className="mt-1 font-medium text-gray-900">
                        {order.payment_method} · {order.payment_status}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        Delivery address
                      </p>
                      <p className="mt-1 leading-5 text-gray-700">
                        {order.address_name}, {order.street}, {order.city},{" "}
                        {order.state} - {order.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {order.items?.map((item, index) => (
                      <div
                        key={`${order.id}-${item.product_id}-${index}`}
                        className="flex gap-4 px-4 py-4"
                      >
                        <Link
                          to={`/product/${item.product_id}`}
                          className="h-20 w-20 shrink-0 border border-gray-100 bg-white"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-contain p-1 transition hover:opacity-80"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center bg-gray-50 text-gray-400">
                              <Package className="h-7 w-7" />
                            </span>
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <Link
                              to={`/product/${item.product_id}`}
                              className="font-semibold text-gray-950 hover:text-blue-700 hover:underline"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold text-gray-950">
                            {formatCurrency.format(item.quantity * item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <footer className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-950">
                    <span>Order total</span>
                    <span>
                      {formatCurrency.format(Number(order.total_amount || 0))}
                    </span>
                  </footer>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
