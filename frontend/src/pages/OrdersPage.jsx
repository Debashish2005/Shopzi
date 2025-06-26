import { useEffect, useState } from "react";
import axios from "../api/axios";
import Header from "../components/header";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/orders", { withCredentials: true });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const showCancelToast = (onConfirm) => {
    toast(
      (t) => (
        <span className="text-sm">
          Cancel this order?
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onConfirm();
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
      ),
      { duration: 8000 }
    );
  };

  const cancelOrder = (orderId) => {
    showCancelToast(async () => {
      try {
        await axios.delete(`/orders/${orderId}`, { withCredentials: true });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } catch (err) {
        console.error("Cancel failed", err);
        toast.error("Failed to cancel order");
      }
    });
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { marginTop: "100px" } }} />
      <Header />
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Your Orders</h1>

        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p>You have no orders.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border p-4 rounded-lg bg-white shadow">
                {/* Order header */}
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-lg font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.created_at?.slice(0, 10)} | {order.status}
                    </p>
                    <p className="text-sm text-gray-700">
                      {order.address_name}, {order.street}, {order.city}, {order.state}
                    </p>
                  </div>
                  {order.status === "Placed" && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="border-t pt-2 space-y-2">
{order.items?.map((item, index) => (
  <div key={`${order.id}-${item.product_id}-${index}`} className="flex gap-4">
<Link to={`/product/${item.product_id}`}>
  <img
    src={item.image_url || null}
    alt={item.name}
    onError={(e) => (e.target.src =null)}
    className="w-16 h-16 object-cover rounded hover:opacity-80 transition"
  />
</Link>
    <div className="flex justify-between flex-grow">
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
      </div>
      <div className="text-right text-sm">
        ₹{(item.quantity * item.price).toFixed(2)}
      </div>
    </div>
  </div>
))}

                </div>

                {/* Total */}
                <div className="pt-2 mt-2 border-t flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>
                    ₹{Number(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
