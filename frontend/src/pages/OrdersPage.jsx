import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Package,
  RefreshCw,
  Send,
  X,
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
    "Cancellation Requested":
      "border-orange-200 bg-orange-50 text-orange-800",
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

function CancellationRequestModal({
  order,
  onClose,
  onSubmit,
  submitting,
}) {
  const [reason, setReason] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <div
        className="w-full bg-white shadow-xl sm:max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancellation-title"
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2
              id="cancellation-title"
              className="text-lg font-bold text-gray-950"
            >
              Request cancellation
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Order #{order.id} will remain active until an admin approves the
              request and starts the refund.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 shrink-0 place-items-center text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close cancellation request"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label
              htmlFor="cancellation-reason"
              className="text-sm font-semibold text-gray-800"
            >
              Why would you like to cancel?
            </label>
            <textarea
              id="cancellation-reason"
              required
              minLength={10}
              maxLength={500}
              rows={5}
              autoFocus
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example, I ordered the wrong model."
              className="mt-2 w-full resize-none border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>At least 10 characters</span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Keep order
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 10}
              className="flex h-10 items-center justify-center gap-2 bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cancellationOrder, setCancellationOrder] = useState(null);
  const [requestingCancellation, setRequestingCancellation] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get("/orders");
      const newestFirst = [...(response.data.orders || [])].sort((a, b) => {
        const dateDifference =
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return dateDifference || Number(b.id) - Number(a.id);
      });
      setOrders(newestFirst);
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

  const requestCancellation = async (reason) => {
    if (!cancellationOrder) return;

    setRequestingCancellation(true);
    try {
      const response = await api.post(
        `/orders/${cancellationOrder.id}/cancellation-request`,
        { reason }
      );
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === cancellationOrder.id
            ? {
                ...order,
                cancellation_request_status: "Pending",
                cancellation_request_reason: reason,
                cancellation_request_admin_note: null,
              }
            : order
        )
      );
      setCancellationOrder(null);
      toast.success(
        response.data.message || "Cancellation request sent for review"
      );
    } catch (error) {
      console.error("Cancellation request failed", error);
      toast.error(
        error.response?.data?.message ||
          "Could not submit cancellation request"
      );
    } finally {
      setRequestingCancellation(false);
    }
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
              const canCancelDirectly =
                order.status === "Placed" &&
                !(
                  order.payment_method === "Razorpay" &&
                  order.payment_status === "Paid"
                );
              const canRequestCancellation =
                order.payment_method === "Razorpay" &&
                order.payment_status === "Paid" &&
                ["Placed", "Packed"].includes(order.status) &&
                !["Pending", "Approved"].includes(
                  order.cancellation_request_status
                );
              const displayedStatus =
                order.cancellation_request_status === "Pending"
                  ? "Cancellation Requested"
                  : order.status;

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
                      <OrderStatus status={displayedStatus} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {canCancelDirectly && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="flex h-9 w-fit items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel order
                        </button>
                      )}
                      {canRequestCancellation && (
                        <button
                          type="button"
                          onClick={() => setCancellationOrder(order)}
                          className="flex h-9 items-center gap-2 border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          <MessageSquareText className="h-4 w-4" />
                          {order.cancellation_request_status === "Rejected"
                            ? "Request again"
                            : "Request cancellation"}
                        </button>
                      )}
                    </div>
                  </header>

                  {order.cancellation_request_status === "Pending" && (
                    <div className="flex gap-3 border-b border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />
                      <div>
                        <p className="font-semibold">Awaiting admin review</p>
                        <p className="mt-1 leading-5 text-orange-900">
                          {order.cancellation_request_reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.cancellation_request_status === "Rejected" && (
                    <div className="flex gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                      <div>
                        <p className="font-semibold">
                          Cancellation request declined
                        </p>
                        <p className="mt-1 leading-5 text-red-900">
                          {order.cancellation_request_admin_note ||
                            "The order will continue through fulfilment."}
                        </p>
                      </div>
                    </div>
                  )}

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

      {cancellationOrder && (
        <CancellationRequestModal
          order={cancellationOrder}
          onClose={() => {
            if (!requestingCancellation) setCancellationOrder(null);
          }}
          onSubmit={requestCancellation}
          submitting={requestingCancellation}
        />
      )}
    </div>
  );
}
