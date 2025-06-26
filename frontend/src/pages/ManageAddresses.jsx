import AddressCard from "../components/AddressCard";
import AddressForm from "../components/AddressForm";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import Header from "../components/header";
import Footer from "../components/footer";

function SkeletonAddressCard() {
  return (
    <div className="animate-pulse p-4 border rounded shadow bg-white space-y-2">
      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      <div className="flex gap-2 mt-2">
        <div className="h-8 w-16 bg-gray-300 rounded"></div>
        <div className="h-8 w-16 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

export default function ManageAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editAddressData, setEditAddressData] = useState(null);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/addresses");
      setAddresses(res.data.addresses);
    } catch (err) {
      console.error("Failed to fetch addresses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`/addresses/${id}`);
    fetchAddresses();
  };

  const handleAdd = () => {
    setEditAddressData(null);
    setShowForm(true);
  };

  const handleEdit = (address) => {
    setEditAddressData(address);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditAddressData(null);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editAddressData) {
        await axios.put(`/address/${editAddressData.id}`, formData);
      } else {
        await axios.post("/post-address", formData);
      }
      fetchAddresses();
      setShowForm(false);
      setEditAddressData(null);
    } catch (err) {
      console.error("Failed to save address", err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <>
      <Header />
      <div className="p-4 max-w-3xl mx-auto relative">
        <h2 className="text-2xl font-bold mb-4">Manage Addresses</h2>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonAddressCard key={i} />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 text-center">
            <p className="mb-4 text-gray-600">No addresses added yet.</p>
            <button
              onClick={handleAdd}
              className="p-4 bg-yellow-500 text-white rounded-full shadow-lg hover:bg-yellow-600"
            >
              <Plus size={32} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Floating + Button */}
        <button
          onClick={handleAdd}
          className="fixed bottom-6 right-6 bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-full shadow-lg"
          title="Add new address"
        >
          <Plus size={24} />
        </button>

        {/* Address Form Modal */}
        {showForm && (
          <AddressForm
            onClose={handleFormClose}
            onSubmit={handleFormSubmit}
            initialData={editAddressData}
          />
        )}
      </div>
      <Footer />
    </>
  );
}
