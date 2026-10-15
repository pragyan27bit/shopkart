import React, { useEffect, useState, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { getProducts, getWishlist } from '../services/api';

const Products = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch wishlist item IDs if user is logged in
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }

    const fetchUserWishlist = async () => {
      try {
        const data = await getWishlist();
        if (data.wishlist) {
          const ids = new Set(data.wishlist.map((item) => (item._id || item).toString()));
          setWishlistIds(ids);
        }
      } catch (err) {
        // Ignore auth error if session expired
      }
    };

    fetchUserWishlist();
  }, [user]);

  // Fetch products based on search and category
  const fetchProductsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({ search, category });
      setProducts(data.products || []);
    } catch (err) {
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  // Debounced search / trigger on category change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsList();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchProductsList]);

  return (
    <div className="container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Explore Products
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Find high-quality electronics, fashion, books, and home essentials.
        </p>
      </div>

      {/* Search and Category Filter */}
      <SearchBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      />

      {/* Loading State */}
      {loading && (
        <div className="state-box">
          <div className="state-icon">⏳</div>
          <div className="state-title">Loading products...</div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-box">
          <div className="state-icon">⚠️</div>
          <div className="state-title">{error}</div>
          <button onClick={fetchProductsList} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="state-box">
          <div className="state-icon">📦</div>
          <div className="state-title">No products found.</div>
          <p className="state-desc">Try clearing your search query or selecting a different category.</p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('All Categories');
            }}
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isWishlisted={wishlistIds.has(product._id.toString())}
              isAuthenticated={Boolean(user)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
