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
const [isLoading, setIsLoading] = useState(false);

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


  const handleSearch = (term) => {
  setSearchTerm(term);
};


  return (
    <>
      <Header onSearch={handleSearch} />

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
      <Footer />
    </>
  );
}
