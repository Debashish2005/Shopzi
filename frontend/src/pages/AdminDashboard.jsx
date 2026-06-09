import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Archive,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  ExternalLink,
  LayoutDashboard,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import Header from "../components/header";
import api from "../api/axios";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Boxes },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "users", label: "Users", icon: Users },
];

const orderStatuses = [
  "Placed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  original_price: "",
  category: "",
  stock: "",
};

const inputClass =
  "mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }) {
  const styles = {
    Placed: "bg-blue-50 text-blue-700 border-blue-200",
    Packed: "bg-violet-50 text-violet-700 border-violet-200",
    Shipped: "bg-amber-50 text-amber-800 border-amber-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-800 border-amber-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
    RefundPending: "bg-amber-50 text-amber-800 border-amber-200",
    Refunded: "bg-cyan-50 text-cyan-800 border-cyan-200",
    Processed: "bg-cyan-50 text-cyan-800 border-cyan-200",
  };

  return (
    <span
      className={`inline-flex border px-2 py-0.5 text-xs font-semibold ${
        styles[status] || "border-gray-200 bg-gray-50 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center border border-dashed border-gray-300 bg-white px-6 text-center">
      <ShoppingBag className="mb-3 h-8 w-8 text-gray-400" />
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{message}</p>
    </div>
  );
}

function ProductModal({ mode, product, onClose, onSaved }) {
  const [form, setForm] = useState(product || emptyProduct);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const isEdit = mode === "edit";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await api.put(`/admin/products/${product.id}`, form);
        toast.success("Product updated");
      } else {
        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          payload.append(key, value);
        });
        images.forEach((image) => payload.append("images", image));
        await api.post("/add-product", payload);
        toast.success("Product added");
      }
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5">
      <div className="max-h-[92vh] w-full overflow-y-auto bg-white shadow-xl sm:max-w-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-950">
              {isEdit ? "Edit product" : "Add product"}
            </h2>
            <p className="text-sm text-gray-500">
              {isEdit
                ? "Update catalog details and available inventory."
                : "Create a new product for the Shopzi catalog."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center text-gray-500 hover:bg-gray-100 hover:text-gray-950"
            aria-label="Close product form"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="text-sm font-semibold text-gray-800" htmlFor="name">
              Product name
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              className="text-sm font-semibold text-gray-800"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-gray-800"
                htmlFor="price"
              >
                Selling price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-gray-800"
                htmlFor="original_price"
              >
                Original price
              </label>
              <input
                id="original_price"
                type="number"
                min="0"
                step="0.01"
                value={form.original_price || ""}
                onChange={(event) =>
                  setForm({ ...form, original_price: event.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-sm font-semibold text-gray-800"
                htmlFor="category"
              >
                Category
              </label>
              <input
                id="category"
                value={form.category || ""}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-gray-800"
                htmlFor="stock"
              >
                Stock
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                required
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: event.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label
                className="text-sm font-semibold text-gray-800"
                htmlFor="images"
              >
                Product images
              </label>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                required
                onChange={(event) =>
                  setImages(Array.from(event.target.files || []))
                }
                className={`${inputClass} file:mr-3 file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold`}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Upload up to five clear product images.
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [statsData, setStatsData] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [productModal, setProductModal] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadAdminData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    try {
      const [statsResponse, productsResponse, ordersResponse, usersResponse] =
        await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/products"),
          api.get("/admin/orders"),
          api.get("/admin/users"),
        ]);

      setStatsData(statsResponse.data);
      setProducts(productsResponse.data.products);
      setOrders(ordersResponse.data.orders);
      setUsers(usersResponse.data.users);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load the admin dashboard"
      );
      if ([401, 403].includes(error.response?.status)) {
        navigate("/dashboard", { replace: true });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await api.get("/me");
        if (response.data.role !== "admin") {
          navigate("/dashboard", { replace: true });
          return;
        }
        setCurrentUser(response.data);
        await loadAdminData();
      } catch {
        navigate("/login", { replace: true });
      }
    };

    initialize();
  }, [loadAdminData, navigate]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term);
      const matchesFilter =
        productFilter === "all" ||
        (productFilter === "active" && product.is_active) ||
        (productFilter === "archived" && !product.is_active) ||
        (productFilter === "low_stock" &&
          product.is_active &&
          Number(product.stock) <= 5);
      return matchesSearch && matchesFilter;
    });
  }, [productFilter, products, search]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        String(order.id).includes(term) ||
        order.full_name.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term);
      return (
        matchesSearch &&
        (orderFilter === "all" || order.status === orderFilter)
      );
    });
  }, [orderFilter, orders, search]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter(
      (user) =>
        !term ||
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        String(user.mobile || "").includes(term)
    );
  }, [search, users]);

  const refresh = () => loadAdminData(true);

  const archiveProduct = async (product) => {
    if (!window.confirm(`Archive "${product.name}"?`)) return;
    setUpdatingId(`product-${product.id}`);
    try {
      await api.delete(`/admin/products/${product.id}`);
      toast.success("Product archived");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not archive product");
    } finally {
      setUpdatingId(null);
    }
  };

  const restoreProduct = async (product) => {
    setUpdatingId(`product-${product.id}`);
    try {
      await api.patch(`/admin/products/${product.id}/restore`);
      toast.success("Product restored");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not restore product");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateOrderStatus = async (order, status) => {
    if (status === "Cancelled" && !window.confirm(`Cancel order #${order.id}?`)) {
      return;
    }
    setUpdatingId(`order-${order.id}`);
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status });
      toast.success("Order status updated");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const refundOrder = async (order) => {
    if (
      !window.confirm(
        `Refund ${formatMoney(order.total_amount)} and cancel order #${order.id}?`
      )
    ) {
      return;
    }

    setUpdatingId(`refund-${order.id}`);
    try {
      const response = await api.post(`/admin/orders/${order.id}/refund`);
      toast.success(response.data.message);
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not refund payment");
    } finally {
      setUpdatingId(null);
    }
  };

  const syncRefund = async (order) => {
    setUpdatingId(`refund-${order.id}`);
    try {
      const response = await api.post(
        `/admin/orders/${order.id}/refund/sync`
      );
      toast.success(response.data.message);
      await refresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not refresh refund status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateUserRole = async (user, role) => {
    if (!window.confirm(`Change ${user.full_name}'s role to ${role}?`)) return;
    setUpdatingId(`user-${user.id}`);
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      toast.success("User role updated");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update user role");
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = [
    {
      label: "Revenue",
      value: formatMoney(statsData?.stats?.revenue),
      note: "Paid and delivered orders",
      icon: CircleDollarSign,
      accent: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Orders",
      value: statsData?.stats?.total_orders || 0,
      note: `${statsData?.stats?.open_orders || 0} currently open`,
      icon: ClipboardList,
      accent: "text-blue-700 bg-blue-50",
    },
    {
      label: "Low stock",
      value: statsData?.stats?.low_stock_products || 0,
      note: "Five units or fewer",
      icon: TriangleAlert,
      accent: "text-amber-800 bg-amber-50",
    },
    {
      label: "Customers",
      value: statsData?.stats?.customers || 0,
      note: `${statsData?.stats?.total_users || 0} total accounts`,
      icon: Users,
      accent: "text-violet-700 bg-violet-50",
    },
  ];

  const searchPlaceholder =
    activeTab === "products"
      ? "Search products or categories"
      : activeTab === "orders"
        ? "Search order ID, customer or email"
        : "Search users by name, email or mobile";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="flex min-h-[70vh] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-950">
      <Toaster position="top-center" />
      <Header />

      <div className="border-b border-gray-300 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <ShieldCheck className="h-4 w-4" />
              Administrator workspace
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-950">
              Admin dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage products, inventory, orders and user access.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className="flex h-10 items-center justify-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              Storefront
            </Link>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="grid h-10 w-10 place-items-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div className="mb-5 overflow-x-auto border-b border-gray-300">
          <div className="flex min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearch("");
                  }}
                  className={`flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${
                    activeTab === tab.id
                      ? "border-yellow-500 bg-white text-gray-950"
                      : "border-transparent text-gray-600 hover:bg-white hover:text-gray-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="border border-gray-300 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-950">
                          {card.value}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{card.note}</p>
                      </div>
                      <span className={`grid h-10 w-10 place-items-center ${card.accent}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
              <section className="border border-gray-300 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <h2 className="font-bold text-gray-950">Recent orders</h2>
                    <p className="text-xs text-gray-500">
                      Latest activity across Shopzi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-sm font-semibold text-blue-700 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {statsData?.recent_orders?.length ? (
                    statsData.recent_orders.map((order) => (
                      <div
                        key={order.id}
                        className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-950">
                            Order #{order.id} · {order.full_name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {order.item_count} item(s) · {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 sm:justify-end">
                          <StatusBadge status={order.status} />
                          <span className="text-sm font-bold text-gray-950">
                            {formatMoney(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-gray-500">
                      No orders have been placed yet.
                    </div>
                  )}
                </div>
              </section>

              <section className="border border-gray-300 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div>
                    <h2 className="font-bold text-gray-950">Low-stock products</h2>
                    <p className="text-xs text-gray-500">Restock attention</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProductFilter("low_stock");
                      setActiveTab("products");
                    }}
                    className="text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="divide-y divide-gray-200">
                  {statsData?.low_stock_products?.length ? (
                    statsData.low_stock_products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="h-11 w-11 shrink-0 border border-gray-200 bg-gray-50">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.category || "Uncategorized"}
                          </p>
                        </div>
                        <span className="border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                          {product.stock} left
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-gray-500">
                      Inventory levels look healthy.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab !== "overview" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {activeTab === "products" && (
                  <>
                    <select
                      value={productFilter}
                      onChange={(event) => setProductFilter(event.target.value)}
                      className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-blue-600"
                    >
                      <option value="all">All products</option>
                      <option value="active">Active</option>
                      <option value="low_stock">Low stock</option>
                      <option value="archived">Archived</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setProductModal({ mode: "add", product: null })
                      }
                      className="flex h-10 items-center gap-2 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <PackagePlus className="h-4 w-4" />
                      Add product
                    </button>
                  </>
                )}
                {activeTab === "orders" && (
                  <select
                    value={orderFilter}
                    onChange={(event) => setOrderFilter(event.target.value)}
                    className="h-10 border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-blue-600"
                  >
                    <option value="all">All statuses</option>
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {activeTab === "products" &&
              (filteredProducts.length ? (
                <div className="overflow-hidden border border-gray-300 bg-white">
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Product</th>
                          <th className="px-4 py-3 font-semibold">Category</th>
                          <th className="px-4 py-3 font-semibold">Price</th>
                          <th className="px-4 py-3 font-semibold">Inventory</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 shrink-0 border border-gray-200 bg-white">
                                  {product.image_url && (
                                    <img
                                      src={product.image_url}
                                      alt=""
                                      className="h-full w-full object-contain"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="max-w-xs truncate font-semibold text-gray-950">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Product #{product.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {product.category || "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {formatMoney(product.price)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={
                                  Number(product.stock) <= 5
                                    ? "font-bold text-red-700"
                                    : "text-gray-700"
                                }
                              >
                                {product.stock} units
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex border px-2 py-0.5 text-xs font-semibold ${
                                  product.is_active
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-gray-300 bg-gray-100 text-gray-600"
                                }`}
                              >
                                {product.is_active ? "Active" : "Archived"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProductModal({
                                      mode: "edit",
                                      product,
                                    })
                                  }
                                  className="grid h-9 w-9 place-items-center text-blue-700 hover:bg-blue-50"
                                  title="Edit product"
                                  aria-label={`Edit ${product.name}`}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                {product.is_active ? (
                                  <button
                                    type="button"
                                    onClick={() => archiveProduct(product)}
                                    disabled={
                                      updatingId === `product-${product.id}`
                                    }
                                    className="grid h-9 w-9 place-items-center text-red-700 hover:bg-red-50 disabled:text-gray-400"
                                    title="Archive product"
                                    aria-label={`Archive ${product.name}`}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => restoreProduct(product)}
                                    disabled={
                                      updatingId === `product-${product.id}`
                                    }
                                    className="grid h-9 w-9 place-items-center text-emerald-700 hover:bg-emerald-50 disabled:text-gray-400"
                                    title="Restore product"
                                    aria-label={`Restore ${product.name}`}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-gray-200 md:hidden">
                    {filteredProducts.map((product) => (
                      <article key={product.id} className="p-4">
                        <div className="flex gap-3">
                          <div className="h-16 w-16 shrink-0 border border-gray-200 bg-white">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-950">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {product.category || "Uncategorized"} · #
                              {product.id}
                            </p>
                            <p className="mt-2 text-sm font-bold">
                              {formatMoney(product.price)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                          <span
                            className={`text-sm font-semibold ${
                              Number(product.stock) <= 5
                                ? "text-red-700"
                                : "text-gray-700"
                            }`}
                          >
                            {product.stock} in stock
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setProductModal({ mode: "edit", product })
                              }
                              className="flex h-9 items-center gap-2 border border-gray-300 px-3 text-sm font-semibold text-blue-700"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                product.is_active
                                  ? archiveProduct(product)
                                  : restoreProduct(product)
                              }
                              className={`grid h-9 w-9 place-items-center border ${
                                product.is_active
                                  ? "border-red-200 text-red-700"
                                  : "border-emerald-200 text-emerald-700"
                              }`}
                              aria-label={
                                product.is_active
                                  ? `Archive ${product.name}`
                                  : `Restore ${product.name}`
                              }
                            >
                              {product.is_active ? (
                                <Trash2 className="h-4 w-4" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No matching products"
                  message="Try another search or inventory filter."
                />
              ))}

            {activeTab === "orders" &&
              (filteredOrders.length ? (
                <div className="overflow-hidden border border-gray-300 bg-white">
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1020px] text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Order</th>
                          <th className="px-4 py-3 font-semibold">Customer</th>
                          <th className="px-4 py-3 font-semibold">Payment</th>
                          <th className="px-4 py-3 font-semibold">Total</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-semibold">#{order.id}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.created_at)} · {order.item_count} item(s)
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{order.full_name}</p>
                              <p className="text-xs text-gray-500">
                                {order.email}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{order.payment_method}</p>
                              <StatusBadge status={order.payment_status} />
                            </td>
                            <td className="px-4 py-3 font-bold">
                              {formatMoney(order.total_amount)}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={order.status}
                                disabled={
                                  updatingId === `order-${order.id}` ||
                                  order.status === "Cancelled"
                                }
                                onChange={(event) =>
                                  updateOrderStatus(order, event.target.value)
                                }
                                className="h-9 min-w-32 border border-gray-300 bg-white px-2 text-sm font-semibold outline-none focus:border-blue-600 disabled:bg-gray-100 disabled:text-gray-500"
                              >
                                {orderStatuses.map((status) => (
                                  <option
                                    key={status}
                                    value={status}
                                    disabled={
                                      status === "Cancelled" &&
                                      order.payment_method === "Razorpay" &&
                                      order.payment_status === "Paid"
                                    }
                                  >
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                {order.payment_method === "Razorpay" &&
                                  order.payment_status === "Paid" &&
                                  (!order.refund_status ||
                                    order.refund_status === "Failed") && (
                                    <button
                                      type="button"
                                      onClick={() => refundOrder(order)}
                                      disabled={
                                        updatingId === `refund-${order.id}`
                                      }
                                      className="flex h-9 items-center gap-2 border border-red-200 px-3 text-xs font-bold text-red-700 hover:bg-red-50 disabled:text-gray-400"
                                    >
                                      {updatingId === `refund-${order.id}` ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-4 w-4" />
                                      )}
                                      Refund & cancel
                                    </button>
                                  )}
                                {(order.payment_status === "RefundPending" ||
                                  (order.payment_status === "Paid" &&
                                    ["Pending", "Processed"].includes(
                                      order.refund_status
                                    ))) && (
                                  <button
                                    type="button"
                                    onClick={() => syncRefund(order)}
                                    disabled={
                                      updatingId === `refund-${order.id}`
                                    }
                                    className="flex h-9 items-center gap-2 border border-amber-200 px-3 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:text-gray-400"
                                  >
                                    <RefreshCw
                                      className={`h-4 w-4 ${
                                        updatingId === `refund-${order.id}`
                                          ? "animate-spin"
                                          : ""
                                      }`}
                                    />
                                    Check refund
                                  </button>
                                )}
                                {order.payment_status === "Refunded" && (
                                  <span className="text-xs font-semibold text-cyan-800">
                                    {order.razorpay_refund_id || "Refunded"}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-gray-200 md:hidden">
                    {filteredOrders.map((order) => (
                      <article key={order.id} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">Order #{order.id}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.created_at)} · {order.item_count} item(s)
                            </p>
                          </div>
                          <p className="font-bold">
                            {formatMoney(order.total_amount)}
                          </p>
                        </div>
                        <div className="border-y border-gray-100 py-3">
                          <p className="text-sm font-semibold">
                            {order.full_name}
                          </p>
                          <p className="break-all text-xs text-gray-500">
                            {order.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {order.payment_method}
                            </span>
                            <StatusBadge status={order.payment_status} />
                          </div>
                          <select
                            value={order.status}
                            disabled={
                              updatingId === `order-${order.id}` ||
                              order.status === "Cancelled"
                            }
                            onChange={(event) =>
                              updateOrderStatus(order, event.target.value)
                            }
                            className="h-9 border border-gray-300 bg-white px-2 text-sm font-semibold"
                          >
                            {orderStatuses.map((status) => (
                              <option
                                key={status}
                                value={status}
                                disabled={
                                  status === "Cancelled" &&
                                  order.payment_method === "Razorpay" &&
                                  order.payment_status === "Paid"
                                }
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        {order.payment_method === "Razorpay" &&
                          order.payment_status === "Paid" &&
                          (!order.refund_status ||
                            order.refund_status === "Failed") && (
                            <button
                              type="button"
                              onClick={() => refundOrder(order)}
                              disabled={updatingId === `refund-${order.id}`}
                              className="flex h-10 w-full items-center justify-center gap-2 border border-red-200 text-sm font-bold text-red-700 hover:bg-red-50 disabled:text-gray-400"
                            >
                              {updatingId === `refund-${order.id}` ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              Refund payment and cancel
                            </button>
                          )}
                        {(order.payment_status === "RefundPending" ||
                          (order.payment_status === "Paid" &&
                            ["Pending", "Processed"].includes(
                              order.refund_status
                            ))) && (
                          <button
                            type="button"
                            onClick={() => syncRefund(order)}
                            disabled={updatingId === `refund-${order.id}`}
                            className="flex h-10 w-full items-center justify-center gap-2 border border-amber-200 text-sm font-bold text-amber-800 hover:bg-amber-50 disabled:text-gray-400"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${
                                updatingId === `refund-${order.id}`
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            Check refund status
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No matching orders"
                  message="Try another customer, order ID, or status filter."
                />
              ))}

            {activeTab === "users" &&
              (filteredUsers.length ? (
                <div className="overflow-hidden border border-gray-300 bg-white">
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold">Mobile</th>
                          <th className="px-4 py-3 font-semibold">Joined</th>
                          <th className="px-4 py-3 font-semibold">Orders</th>
                          <th className="px-4 py-3 font-semibold">Spend</th>
                          <th className="px-4 py-3 font-semibold">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-semibold">{user.full_name}</p>
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {user.mobile || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {user.order_count}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {formatMoney(user.total_spend)}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={user.role}
                                disabled={
                                  updatingId === `user-${user.id}` ||
                                  user.id === currentUser?.id
                                }
                                onChange={(event) =>
                                  updateUserRole(user, event.target.value)
                                }
                                className="h-9 border border-gray-300 bg-white px-2 text-sm font-semibold capitalize outline-none focus:border-blue-600 disabled:bg-gray-100"
                              >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="divide-y divide-gray-200 md:hidden">
                    {filteredUsers.map((user) => (
                      <article key={user.id} className="space-y-3 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{user.full_name}</p>
                            {user.id === currentUser?.id && (
                              <span className="bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          <p className="break-all text-xs text-gray-500">
                            {user.email}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {user.mobile || "No mobile"} · Joined{" "}
                            {formatDate(user.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {user.order_count} orders
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatMoney(user.total_spend)} spend
                            </p>
                          </div>
                          <select
                            value={user.role}
                            disabled={
                              updatingId === `user-${user.id}` ||
                              user.id === currentUser?.id
                            }
                            onChange={(event) =>
                              updateUserRole(user, event.target.value)
                            }
                            className="h-9 border border-gray-300 bg-white px-2 text-sm font-semibold capitalize disabled:bg-gray-100"
                          >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No matching users"
                  message="Try another name, email address, or mobile number."
                />
              ))}
          </div>
        )}
      </main>

      {productModal && (
        <ProductModal
          mode={productModal.mode}
          product={
            productModal.product
              ? {
                  ...productModal.product,
                  original_price: productModal.product.original_price || "",
                }
              : null
          }
          onClose={() => setProductModal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
