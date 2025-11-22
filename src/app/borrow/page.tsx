'use client';
import React, { useEffect, useState } from 'react';
import Breadcrumb from '@/components/navigation/Breadcrumb';

interface Book { 
  _id: string; 
  title: string; 
  author: string; 
  description?: string; 
  genre?: string;
  condition?: string;
  rentalFee?: number;
  securityDeposit?: number;
  available: boolean;
  coverUrl?: string;
  lender?: { name: string };
}

interface FilterState {
  genre: string;
  condition: string;
  priceRange: string;
  availability: string;
  sortBy: string;
}

export default function BorrowPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genre: '',
    condition: '',
    priceRange: '',
    availability: 'available',
    sortBy: 'title'
  });

  // Available filter options
  const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Biography', 'History', 'Science', 'Technology'];
  const conditions = ['new', 'like-new', 'good', 'fair', 'poor'];
  const priceRanges = [
    { label: 'Free', value: '0-0' },
    { label: 'Under $5', value: '0-5' },
    { label: '$5 - $15', value: '5-15' },
    { label: '$15 - $30', value: '15-30' },
    { label: '$30+', value: '30-999' }
  ];

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/books/search');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  async function doSearch() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (filters.genre) params.set('genre', filters.genre);
      if (filters.condition) params.set('condition', filters.condition);
      if (filters.availability) params.set('availability', filters.availability);
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-');
        params.set('minPrice', min);
        params.set('maxPrice', max);
      }
      params.set('sortBy', filters.sortBy);

      const url = '/api/books/search?' + params.toString();
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally { setLoading(false); }
  }

  const clearFilters = () => {
    setFilters({
      genre: '',
      condition: '',
      priceRange: '',
      availability: 'available',
      sortBy: 'title'
    });
    setQuery('');
  };

  useEffect(() => { loadAll(); }, []);

  // Apply search when filters change
  useEffect(() => {
    if (filters.genre || filters.condition || filters.priceRange || filters.sortBy !== 'title') {
      doSearch();
    }
  }, [filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Books</h1>
        <p className="text-gray-600">Discover and borrow books from our community library</p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="p-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title, author, or description..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter'){ doSearch(); } }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={doSearch}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Genre Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                  <select
                    value={filters.genre}
                    onChange={e => setFilters(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <select
                    value={filters.condition}
                    onChange={e => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Condition</option>
                    {conditions.map(condition => (
                      <option key={condition} value={condition} className="capitalize">{condition.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={e => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Price</option>
                    {priceRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                  <select
                    value={filters.availability}
                    onChange={e => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Books</option>
                    <option value="available">Available Only</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="title">Title (A-Z)</option>
                    <option value="-title">Title (Z-A)</option>
                    <option value="author">Author (A-Z)</option>
                    <option value="rentalFee">Price (Low to High)</option>
                    <option value="-rentalFee">Price (High to Low)</option>
                    <option value="-createdAt">Recently Added</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading books...</span>
        </div>
      )}
      
      {error && !loading && (
        <div className="text-center py-16">
          <div className="text-red-600 mb-2">⚠️ {error}</div>
          <button 
            onClick={loadAll} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {results.length} {results.length === 1 ? 'Book' : 'Books'} Found
            </h2>
          </div>

          {results.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map(book => (
                <a 
                  key={book._id} 
                  href={`/books/${book._id}`}
                  className="group block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 border hover:border-blue-200 overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                    <img 
                      src={book.coverUrl || '/images/default-book-cover.svg'} 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                      <div className={`flex-shrink-0 ml-2 w-2 h-2 rounded-full ${
                        book.available ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">by {book.author}</div>
                    <div className="text-xs text-gray-500 mb-3">
                      Lender: {book.lender?.name || 'Unknown'}
                    </div>
                    {book.rentalFee !== undefined && (
                      <div className="text-sm font-medium text-blue-600">
                        {book.rentalFee === 0 ? 'Free' : `$${book.rentalFee}/rental`}
                      </div>
                    )}
                    {book.condition && (
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {book.condition.replace('-', ' ')} condition
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Books Found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search terms or filters</p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
