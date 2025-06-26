import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

export default function AddressCard({ address, onEdit, onDelete }) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    setShowModal(true);
  };

  const confirmDelete = () => {
    onDelete(address.id);
    setShowModal(false);
  };

  return (
    <div className="border p-4 rounded-lg shadow-md bg-white relative">
      <h3 className="font-semibold text-lg">{address.name}</h3>
      <p>{address.street}</p>
      <p>{address.city}, {address.state} - {address.pincode}</p>
      <div className="flex gap-4 mt-2">
        <button onClick={() => onEdit(address)} className="text-blue-600 hover:underline flex items-center gap-1">
          <Pencil size={16} /> Edit
        </button>
        <button onClick={handleDelete} className="text-red-600 hover:underline flex items-center gap-1">
          <Trash2 size={16} /> Delete
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmDelete}
        addressName={address.name}
      />
    </div>
  );
}
