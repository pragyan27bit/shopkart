import React from 'react';

const categories = ['All Categories', 'Electronics', 'Fashion', 'Books', 'Home'];

const SearchBar = ({ search, onSearchChange, category, onCategoryChange }) => {
  return (
    <div className="filter-bar">
      <div className="search-input-wrap">
        <input
          type="text"
          className="form-control"
          placeholder="Search products..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="category-select-wrap">
        <select
          className="form-control"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchBar;
