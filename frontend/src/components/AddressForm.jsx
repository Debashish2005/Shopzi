// components/AddressForm.jsx
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function AddressForm({ onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center">
      <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-6 md:mx-auto animate-fadeIn">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>

        <h3 className="text-xl font-bold mb-4">
          {initialData ? "Edit Address" : "Add New Address"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Name"
            className="w-full border rounded p-2"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            name="street"
            placeholder="Street"
            className="w-full border rounded p-2"
            value={formData.street}
            onChange={handleChange}
            required
          />
          <input
            name="city"
            placeholder="City"
            className="w-full border rounded p-2"
            value={formData.city}
            onChange={handleChange}
            required
          />
          <input
            name="state"
            placeholder="State"
            className="w-full border rounded p-2"
            value={formData.state}
            onChange={handleChange}
            required
          />
          <input
            name="pincode"
            placeholder="Pincode"
            className="w-full border rounded p-2"
            value={formData.pincode}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full"
          >
            {initialData ? "Update Address" : "Save Address"}
          </button>
        </form>
      </div>
    </div>
  );
}
