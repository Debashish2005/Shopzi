import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import Header from "../components/header";
import Footer from "../components/footer";

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded shadow p-4">
      <div className="h-32 bg-gray-300 rounded mb-4"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    setIsLoading(true);
    api.get(`/products?search=${query.trim()}`)
      .then(res => setResults(res.data.products))
      .catch(err => console.error("Search failed", err))
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <>
      <Header />
      <main className="p-4 min-h-screen bg-gray-50">
        <h1 className="text-2xl font-semibold mb-4">
          Search Results for: "{query}"
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No products found.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
