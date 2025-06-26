import { useEffect, useState } from "react";
import Header from "../components/header";
import ProductCard from "../components/ProductCard";
import Footer from "../components/footer";
import api from "../api/axios";

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded shadow p-4">
      <div className="h-32 bg-gray-300 rounded mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
}


const dummySections = [
  {
    title: "Pick up where you left off",
    products: [
      {
        id: 1,
        name: "iQOO Z10x 5G",
        description: "Ultramarine Blue, 128GB",
        price: 12999,
        image: "/images/iQOO Z10x 5G.webp",
        dummy: true
      },
      {
        id: 2,
        name: "Samsung Galaxy M16",
        description: "5G, Mint Green",
        price: 15999,
        image: "/images/Samsung Galaxy M16.webp",
        dummy: true
      },
      {
        id: 7,
        name: "Redmi Note 12",
        description: "6GB RAM, 128GB",
        price: 12999,
        image: "images/Redmi Note 12.webp",
        dummy: true
      },
      {
        id: 8,
        name: "OnePlus Nord CE 3",
        description: "Aqua Surge, 8GB RAM",
        price: 23999,
        image: "images/OnePlus Nord CE 3.webp",
        dummy: true
      },
      {
        id: 9,
        name: "Realme Narzo 60x",
        description: "Stellar Green, 128GB",
        price: 11999,
        image: "images/Realme Narzo 60x.webp",
        dummy: true
      },
      {
        id: 10,
        name: "Moto G73",
        description: "5G, Midnight Blue",
        price: 16999,
        image: "images/Moto G73.webp",
        dummy: true
      },
    ],
  },
  {
    title: "Categories to explore",
    products: [
      {
        id: 3,
        name: "Squeegees",
        description: "Floor and window cleaner",
        price: 199,
        image: "images/Squeegees.webp",
        dummy: true
      },
      {
        id: 4,
        name: "Phone Skins",
        description: "Cool back skins",
        price: 249,
        image: "images/Phone Skins.webp",
        dummy: true
      },
      {
        id: 11,
        name: "Mop Sets",
        description: "Rotating bucket mops",
        price: 899,
        image: "images/Mop Sets.webp",
        dummy: true
      },
      {
        id: 12,
        name: "LED Bulbs",
        description: "Energy efficient, pack of 4",
        price: 349,
        image: "images/LED Bulbs.webp",
        dummy: true
      },
      {
        id: 13,
        name: "Extension Boards",
        description: "Multi-plug 3-socket",
        price: 399,
        image: "images/Extension Boards.webp",
        dummy: true
      },
      {
        id: 14,
        name: "Smart Plugs",
        description: "WiFi-enabled, 10A",
        price: 999,
        image: "/Smart Plugs.webp",
        dummy: true
      },
    ],
  },
  {
    title: "Deals related to items you've saved",
    products: [
      {
        id: 5,
        name: "Puma Flip-Flops",
        description: "Comfortable rubber sole",
        price: 499,
        image: "/Puma Flip-Flops.webp",
        dummy: true
      },
      {
        id: 6,
        name: "Men's T-Shirts",
        description: "Pack of 3",
        price: 799,
        image: "Men's T-Shirts.webp",
        dummy: true
      },
      {
        id: 15,
        name: "Cotton Track Pants",
        description: "Navy Blue, L",
        price: 699,
        image: "Cotton Track Pants.webp",
        dummy: true
      },
      {
        id: 16,
        name: "Running Shoes",
        description: "Lightweight sole",
        price: 1599,
        image: "Running Shoes.webp",
        dummy: true
      },
      {
        id: 17,
        name: "Casual Sneakers",
        description: "White, lace-up",
        price: 1399,
        image: "Casual Sneakers.webp",
        dummy: true
      },
      {
        id: 18,
        name: "Caps and Hats",
        description: "Combo of 2",
        price: 299,
        image: "Caps and Hats.webp",
        dummy: true
      },
    ],
  },
];

export default function Dashboard() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
const [previewUrls, setPreviewUrls] = useState([]);
const [user, setUser] = useState(null);
const [isLoading, setIsLoading] = useState(false);

useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me"); // will include cookie
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchUser();
  }, []);

  const [form, setForm] = useState({
  name: "",
  description: "",
  price: "",
  original_price: "",
  category: "",
  stock: "",
});
const [images, setImages] = useState([]);
const handleChange = (e) => {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
};

const handleImageChange = (e) => {
  const files = Array.from(e.target.files);
  setImages(files);

  const previewList = files.map((file) => URL.createObjectURL(file));
  setPreviewUrls(previewList);
};

// On unmount, revoke object URLs to prevent memory leaks
useEffect(() => {
  return () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  };
}, [previewUrls]);


const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData();
  Object.entries(form).forEach(([key, value]) => {
    data.append(key, value);
  });

  for (let i = 0; i < images.length; i++) {
    data.append("images", images[i]);
  }

  try {
    await api.post("/add-product", data); // your backend route
    alert("Product added!");
    setShowAddForm(false);
    setForm({
      name: "",
      description: "",
      price: "",
      original_price: "",
      category: "",
      stock: "",
    });
    setImages([]);
  } catch (err) {
    console.error("Upload error", err);
    alert("Failed to upload");
  }
};

useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (searchTerm.trim() === "") {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // start loading
    api.get(`/products?search=${searchTerm.trim()}`)
      .then(res => {
        setSearchResults(res.data.products);
      })
      .catch(err => {
        console.error("Search failed", err);
      })
      .finally(() => {
        setIsLoading(false); // end loading
      });
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [searchTerm]);


  const allDummyProducts = dummySections.flatMap(section => section.products);
  const handleSearch = (term) => {
  setSearchTerm(term);
};


  return (
    <>
      <Header onSearch={handleSearch} />

{user && user.id === 4 && user.full_name === "debashish mallick" && (

  <div className="flex justify-end px-4 mt-2">
    <button
      onClick={() => setShowAddForm(true)}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
    >
      + Add Product
    </button>
  </div>
)}



<main className="p-4 bg-gray-100 min-h-screen">
{searchTerm ? (
  isLoading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  ) : searchResults.length > 0 ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {searchResults.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  ) : (
    <div className="flex items-center justify-center h-64">
      <p className="text-center text-gray-500 text-lg">
        No products found for "{searchTerm}"
      </p>
    </div>
  )
) : (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {dummySections.map((section, index) => (
        <div key={index} className="bg-white p-4 rounded shadow h-full">
          <h2 className="text-lg sm:text-xl font-bold mb-3">{section.title}</h2>
          <div className="grid grid-cols-2 gap-4">
            {section.products.map(product => (
<ProductCard
  key={product.id}
  product={{
    ...product,
    price: Number(product.price),
    original_price: Number(product.original_price) || undefined,
    image_url: product.image_url || product.image, // fallback to dummy image
    rating: product.rating || 4,
    reviews: product.reviews || 123,
    is_prime: product.is_prime ?? false,
    stock: product.stock || 10,
  }}
/>

            ))}
          </div>
        </div>
      ))}
    </div>
  )}
</main>
{showAddForm && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-10 z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative">
      <button
        onClick={() => setShowAddForm(false)}
        className="absolute top-2 right-3 text-gray-500 hover:text-black text-xl font-bold"
      >
        ×
      </button>
      {user && user.id === 4 && user.name === "debashish mallick" && (
  <div className="flex justify-end px-4 mt-2">
    <button
      onClick={() => setShowAddForm(true)}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
    >
      + Add Product
    </button>
  </div>
)}

      
      {/* You'll build this form next */}
 <form
  onSubmit={handleSubmit}
  className="space-y-4"
  encType="multipart/form-data"
>
  {/* Name */}
  <div>
    <label className="block text-sm font-medium text-gray-700">Name</label>
    <input
      type="text"
      name="name"
      required
      value={form.name}
      onChange={handleChange}
      className="mt-1 block w-full border border-gray-300 rounded p-2"
    />
  </div>

  {/* Description */}
  <div>
    <label className="block text-sm font-medium text-gray-700">Description</label>
    <textarea
      name="description"
      required
      value={form.description}
      onChange={handleChange}
      className="mt-1 block w-full border border-gray-300 rounded p-2"
    />
  </div>

  {/* Price */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Price</label>
      <input
        type="number"
        name="price"
        required
        value={form.price}
        onChange={handleChange}
        className="mt-1 block w-full border border-gray-300 rounded p-2"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Original Price</label>
      <input
        type="number"
        name="original_price"
        value={form.original_price}
        onChange={handleChange}
        className="mt-1 block w-full border border-gray-300 rounded p-2"
      />
    </div>
  </div>

  {/* Category + Stock */}
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <input
        type="text"
        name="category"
        value={form.category}
        onChange={handleChange}
        className="mt-1 block w-full border border-gray-300 rounded p-2"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Stock</label>
      <input
        type="number"
        name="stock"
        value={form.stock}
        onChange={handleChange}
        className="mt-1 block w-full border border-gray-300 rounded p-2"
      />
    </div>
  </div>

  {/* Multiple Images */}
  <div>
    <label className="block text-sm font-medium text-gray-700">
      Product Images (You can select multiple)
    </label>
    <input
      type="file"
      name="images"
      multiple
      accept="image/*"
      onChange={handleImageChange}
      className="mt-1 block w-full border border-gray-300 rounded p-2"
    />
    {previewUrls.length > 0 && (
  <div className="grid grid-cols-3 gap-2 mt-2">
    {previewUrls.map((url, i) => (
      <img
        key={i}
        src={url}
        alt={`Preview ${i}`}
        className="w-full h-24 object-cover rounded border"
      />
    ))}
  </div>
)}

  </div>

  {/* Submit */}
  <button
    type="submit"
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
  >
    Submit
  </button>
</form>

    </div>
  </div>
)}

      <Footer />
    </>
  );
}
