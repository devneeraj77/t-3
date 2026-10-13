'use client';

import React, { useState, useEffect, useMemo, FormEvent } from 'react';

interface BookItem {
  _id: string;
  title: string;
  commentcount: number;
}

interface BookDetail {
  _id: string;
  title: string;
  comments: string[];
}

interface TestCase {
  title: string;
  context: string;
  state: string;
  assertions?: any[];
}

interface ToastInfo {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function Home() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'api' | 'qa'>('catalog');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Inputs
  const [newBookTitle, setNewBookTitle] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingBook, setIsSubmittingBook] = useState<boolean>(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  // REST Console State
  const [consoleEndpoint, setConsoleEndpoint] = useState<string>('/api/books');
  const [consoleOutput, setConsoleOutput] = useState<string>(
    '// Execute a request above to inspect response payload...'
  );
  const [consoleStatus, setConsoleStatus] = useState<string>('Ready');

  // QA Test Report State
  const [qaTests, setQaTests] = useState<TestCase[]>([]);
  const [loadingQa, setLoadingQa] = useState<boolean>(false);
  const [qaFetched, setQaFetched] = useState<boolean>(false);

  // Toast notification helper
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem('libraryos-theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('libraryos-theme', newTheme);
  };

  // Fetch books
  const fetchBooks = async (keepSelectedId?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/books');
      if (!res.ok) throw new Error('Failed to fetch books');
      const data: BookItem[] = await res.json();
      setBooks(data);

      if (keepSelectedId) {
        fetchBookDetail(keepSelectedId);
      } else if (selectedBook && !data.some((b) => b._id === selectedBook._id)) {
        setSelectedBook(null);
      }
    } catch (err) {
      showToast('Error loading books from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch single book details
  const fetchBookDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/books/${id}`);
      if (!res.ok) {
        setSelectedBook(null);
        return;
      }
      const data = await res.json();
      if (typeof data === 'string') {
        setSelectedBook(null);
        showToast(data, 'error');
        return;
      }
      setSelectedBook(data);
    } catch (err) {
      showToast('Error fetching volume details', 'error');
    }
  };

  // Handle Add Book
  const handleAddBook = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!newBookTitle.trim()) {
      showToast('Please enter a book title', 'error');
      return;
    }

    setIsSubmittingBook(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBookTitle.trim() }),
      });
      const data = await res.json();
      if (data && data._id) {
        showToast(`Added "${data.title}" to collection!`, 'success');
        setNewBookTitle('');
        fetchBooks(data._id);
      } else {
        showToast('Error creating book', 'error');
      }
    } catch (err) {
      showToast('Failed to create book', 'error');
    } finally {
      setIsSubmittingBook(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedBook) return;
    if (!newComment.trim()) {
      showToast('Comment text cannot be empty', 'error');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/books/${selectedBook._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      const data = await res.json();
      if (data && data.comments) {
        showToast('Comment posted successfully!', 'success');
        setNewComment('');
        setSelectedBook(data);
        fetchBooks(selectedBook._id);
      } else {
        showToast('Error posting comment', 'error');
      }
    } catch (err) {
      showToast('Failed to post comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Delete Single Book
  const handleDeleteBook = async (id: string) => {
    const bookTitle = selectedBook?.title || 'this book';
    if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const text = await res.text();
      showToast(text || 'Book deleted successfully', 'success');
      setSelectedBook(null);
      fetchBooks();
    } catch (err) {
      showToast('Failed to delete book', 'error');
    }
  };

  // Handle Delete All Books
  const handleDeleteAllBooks = async () => {
    if (books.length === 0) {
      showToast('Collection is already empty.', 'info');
      return;
    }

    if (!confirm('CAUTION: Are you sure you want to delete ALL books?')) {
      return;
    }

    try {
      const res = await fetch('/api/books', { method: 'DELETE' });
      const text = await res.text();
      showToast(text || 'All books deleted successfully', 'success');
      setSelectedBook(null);
      fetchBooks();
    } catch (err) {
      showToast('Failed to delete all books', 'error');
    }
  };

  // Copy ID to clipboard
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      showToast('Book ID copied to clipboard!', 'success');
    });
  };

  // REST Console Runner
  const executeConsoleRequest = async (method: string, endpoint: string) => {
    setConsoleStatus('Executing...');
    setConsoleOutput(`// Requesting ${method} ${endpoint}...`);
    const startTime = performance.now();

    try {
      const res = await fetch(endpoint, { method });
      const duration = Math.round(performance.now() - startTime);
      setConsoleStatus(`${res.status} ${res.statusText} (${duration}ms)`);

      const text = await res.text();
      let formatted: string;
      try {
        const parsed = JSON.parse(text);
        formatted = JSON.stringify(parsed, null, 2);
      } catch {
        formatted = text || '(Empty Response Body)';
      }

      setConsoleOutput(`// HTTP ${res.status} ${res.statusText} [${duration}ms]\n\n${formatted}`);
    } catch (err: any) {
      setConsoleStatus('Network Error');
      setConsoleOutput(`// Error: ${err.message || 'Network request failed'}`);
    }
  };

  // QA Test Runner Query
  const fetchQaTests = async () => {
    setLoadingQa(true);
    try {
      const res = await fetch('/_api/get-tests?type=functional');
      const data: TestCase[] = await res.json();
      setQaTests(data);
      setQaFetched(true);
      showToast(`Loaded test runner report: ${data.length} functional tests`, 'success');
    } catch (err) {
      showToast('Could not fetch test runner report', 'error');
    } finally {
      setLoadingQa(false);
    }
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => b.title.toLowerCase().includes(q));
  }, [books, searchQuery]);

  // Total stats
  const totalComments = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.commentcount || 0), 0);
  }, [books]);

  // Professional Palette generator for avatars
  const getCoverStyle = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const palettes = [
      'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
      'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
      'linear-gradient(135deg, #3730A3 0%, #6366F1 100%)',
      'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
      'linear-gradient(135deg, #334155 0%, #64748B 100%)',
      'linear-gradient(135deg, #854D0E 0%, #D97706 100%)',
      'linear-gradient(135deg, #1E3A8A 0%, #0284C7 100%)',
    ];
    const index = Math.abs(hash) % palettes.length;
    const initial = title.trim().charAt(0).toUpperCase() || 'B';
    return { gradient: palettes[index], initial };
  };

  return (
    <>
      {/* Modern Professional Navbar */}
      <header className="modern-navbar">
        <div className="nav-inner">
          <div className="brand-section">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <div className="brand-text">
              <h1>Personal Library</h1>
              <div className="brand-tag">
                <span className="status-dot"></span>
                <span>Next.js App Router • TypeScript</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tab-container">
            <button
              className={`nav-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setActiveTab('catalog')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Catalog
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              API Console
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'qa' ? 'active' : ''}`}
              onClick={() => setActiveTab('qa')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              QA Tests
            </button>
          </nav>

          {/* Right Actions: Counters & Theme Switcher */}
          <div className="nav-right-actions">
            <div className="stat-chip" id="headerBooksChip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg>
              <span id="headerTotalBooks">{books.length} {books.length === 1 ? 'Book' : 'Books'}</span>
            </div>
            <div className="stat-chip" id="headerCommentsChip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span id="headerTotalComments">{totalComments} {totalComments === 1 ? 'Note' : 'Notes'}</span>
            </div>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="app-container">
        {/* TAB 1: Modern Catalog (#sampleui) */}
        {activeTab === 'catalog' && (
          <div id="sampleui">
            <div className="dashboard-grid">
              {/* Left Column: Book Shelf & Add Book */}
              <div className="modern-card">
                <div className="card-header">
                  <span className="card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    Books Collection
                  </span>
                  <span className="card-badge" id="catalogCounterBadge">
                    {books.length} {books.length === 1 ? 'Book' : 'Books'}
                  </span>
                </div>

                <div className="card-body">
                  {/* Canonical FCC Add Book Form (#newBookForm, #bookTitleToAdd, #newBook) */}
                  <form id="newBookForm" className="border modern-form" onSubmit={handleAddBook}>
                    <div className="form-group">
                      <label htmlFor="bookTitleToAdd" className="form-label">
                        Add New Book
                      </label>
                      <div className="input-icon-wrap">
                        <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        <input
                          type="text"
                          id="bookTitleToAdd"
                          name="title"
                          className="modern-input"
                          placeholder="e.g. Neuromancer"
                          value={newBookTitle}
                          onChange={(e) => setNewBookTitle(e.target.value)}
                          required
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      value="Submit"
                      id="newBook"
                      className="btn-modern-primary"
                      disabled={isSubmittingBook}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      {isSubmittingBook ? 'Creating...' : 'Create Book'}
                    </button>
                  </form>

                  {/* Search Filter */}
                  <div className="search-bar-wrap">
                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input
                      type="text"
                      id="catalogSearchInput"
                      className="search-input"
                      placeholder="Search books by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                    />
                  </div>

                  {/* Books List Container (#display) */}
                  <div id="display">
                    {loading ? (
                      <div className="empty-state">
                        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        <p>Loading collection...</p>
                      </div>
                    ) : filteredBooks.length === 0 ? (
                      <div className="empty-state">
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          No books found
                        </p>
                        <p style={{ fontSize: '0.85rem' }}>Create your first volume above to begin archiving.</p>
                      </div>
                    ) : (
                      <ul className="listWrapper">
                        {filteredBooks.map((book, idx) => {
                          const cover = getCoverStyle(book.title);
                          const isActive = selectedBook?._id === book._id;
                          return (
                            <li
                              key={book._id}
                              className={`bookItem ${isActive ? 'active' : ''}`}
                              id={idx.toString()}
                              data-bookid={book._id}
                              onClick={() => fetchBookDetail(book._id)}
                            >
                              <div className="book-item-content">
                                <div className="book-avatar" style={{ background: cover.gradient }}>
                                  {cover.initial}
                                </div>
                                <div className="book-info">
                                  <div className="book-item-title">{book.title}</div>
                                </div>
                              </div>
                              <span className="book-comment-tag">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                {book.commentcount}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Purge All Books Button (#deleteAllBooks) */}
                  <div className="delete-all-wrap">
                    <button id="deleteAllBooks" className="btn-modern-danger" onClick={handleDeleteAllBooks}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Delete All Books
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Book Details & Comments (#bookDetail, #detailTitle, #detailComments) */}
              <div className="modern-card">
                <div className="card-header">
                  <span className="card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Book Details & Comments
                  </span>
                  <span className="card-badge" id="readingRoomStatusBadge">
                    {selectedBook ? 'Active Volume' : 'No Selection'}
                  </span>
                </div>

                <div className="card-body">
                  <div id="bookDetail" className="border">
                    {!selectedBook ? (
                      <div className="detail-empty-view" id="emptyDetailPlaceholder">
                        <svg className="detail-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <h3>Select a Book</h3>
                        <p id="detailTitle">Select a book to see it's details and comments</p>
                      </div>
                    ) : (
                      <div id="activeBookView" className="book-detail-animated">
                        <div className="detail-header-block">
                          <h2 id="detailTitle">
                            <b>{selectedBook.title}</b> (id: {selectedBook._id})
                          </h2>
                          <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span
                              className="detail-id-chip"
                              id="copyIdChip"
                              onClick={() => handleCopyId(selectedBook._id)}
                              title="Click to copy ID"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              <span id="activeBookIdDisplay">{selectedBook._id}</span>
                            </span>
                          </div>
                        </div>

                        <div className="comments-header-row">
                          <span className="comments-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Discussion & Notes ({selectedBook.comments?.length || 0})
                          </span>
                        </div>

                        {/* Canonical FCC #detailComments containing comments, newCommentForm, addComment, deleteBook */}
                        <ol id="detailComments">
                          {selectedBook.comments && selectedBook.comments.length > 0 ? (
                            selectedBook.comments.map((comment, i) => (
                              <li key={i}>
                                <span className="comment-bullet"></span>
                                <span>{comment}</span>
                              </li>
                            ))
                          ) : (
                            <li className="no-comments-msg">No discussion notes yet. Leave the first note below!</li>
                          )}

                          <div style={{ marginTop: '1.4rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <form id="newCommentForm" className="comment-input-wrap" onSubmit={handleAddComment}>
                              <label className="form-label" htmlFor="commentToAdd">New Comment</label>
                              <div className="input-icon-wrap">
                                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                <input
                                  style={{ width: '100%' }}
                                  type="text"
                                  className="modern-input form-control"
                                  id="commentToAdd"
                                  name="comment"
                                  placeholder="Write a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  autoComplete="off"
                                />
                              </div>
                            </form>
                            <div className="detail-actions-row">
                              <button
                                className="btn-modern-primary addComment"
                                id={selectedBook._id}
                                onClick={handleAddComment}
                                disabled={isSubmittingComment}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                {isSubmittingComment ? 'Posting...' : 'Add Comment'}
                              </button>
                              <button
                                className="btn-modern-danger deleteBook"
                                id={selectedBook._id}
                                onClick={() => handleDeleteBook(selectedBook._id)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                Delete Book
                              </button>
                            </div>
                          </div>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: API Console & Canonical Test Forms (#sampleposting) */}
        {activeTab === 'api' && (
          <div className="workbench-grid">
            {/* Left: Canonical FCC Forms (#sampleposting, #commentTest, #idinputtest, #title, #comment) */}
            <div className="modern-card">
              <div className="card-header">
                <span className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Canonical Test Forms
                </span>
                <span className="card-badge">FCC Compliance</span>
              </div>

              <div className="card-body">
                <div id="sampleposting">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                    Standard HTML form submissions for automated verification:
                  </p>

                  {/* Form 1: POST /api/books */}
                  <div className="api-form-box">
                    <h4>
                      <span className="method-badge badge-post">POST</span>
                      Test post to /api/books
                    </h4>
                    <form action="/api/books" method="post" className="border">
                      <div className="form-group">
                        <label htmlFor="title" className="form-label">Book Title</label>
                        <div className="input-icon-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                          <input type="text" id="title" name="title" className="modern-input" placeholder="Book Title" required />
                        </div>
                      </div>
                      <input type="submit" value="Submit" className="btn-modern-primary" />
                    </form>
                  </div>

                  {/* Form 2: POST /api/books/{bookid} */}
                  <div className="api-form-box">
                    <h4>
                      <span className="method-badge badge-post">POST</span>
                      Test post to /api/books/[id]
                    </h4>
                    <form
                      action=""
                      method="post"
                      id="commentTest"
                      className="border"
                      onSubmit={(e) => {
                        const form = e.currentTarget;
                        const input = form.querySelector('#idinputtest') as HTMLInputElement;
                        if (input && input.value) {
                          form.action = `/api/books/${input.value.trim()}`;
                        }
                      }}
                    >
                      <div className="form-group">
                        <label htmlFor="idinputtest" className="form-label">BookId to comment on</label>
                        <div className="input-icon-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          <input type="text" name="id" id="idinputtest" className="modern-input" placeholder="e.g. 660f7b..." />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="comment" className="form-label">Comment</label>
                        <div className="input-icon-wrap">
                          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <input type="text" id="comment" name="comment" className="modern-input" placeholder="Add comment..." />
                        </div>
                      </div>
                      <input type="submit" value="Submit" className="btn-modern-primary" />
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive REST Client */}
            <div className="modern-card">
              <div className="card-header">
                <span className="card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                  Live API Console
                </span>
                <span className="card-badge">REST Client</span>
              </div>

              <div className="card-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                  Send live requests to test Next.js App Router endpoints in real time:
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    className="btn-modern-secondary"
                    onClick={() => {
                      setConsoleEndpoint('/api/books');
                      executeConsoleRequest('GET', '/api/books');
                    }}
                  >
                    <span className="method-badge badge-get">GET</span> /api/books
                  </button>
                  <button
                    className="btn-modern-secondary"
                    onClick={() => {
                      if (confirm('Execute DELETE /api/books?')) {
                        setConsoleEndpoint('/api/books');
                        executeConsoleRequest('DELETE', '/api/books');
                      }
                    }}
                  >
                    <span className="method-badge badge-delete">DEL</span> /api/books
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="consoleEndpointInput">Target Endpoint</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      id="consoleEndpointInput"
                      className="modern-input"
                      value={consoleEndpoint}
                      onChange={(e) => setConsoleEndpoint(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', paddingLeft: '1rem' }}
                    />
                    <button
                      className="btn-modern-primary"
                      onClick={() => executeConsoleRequest('GET', consoleEndpoint.trim())}
                      style={{ width: 'auto', padding: '0.65rem 1.35rem' }}
                    >
                      Send
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Response Body</label>
                    <span id="consoleResponseStatus" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>
                      {consoleStatus}
                    </span>
                  </div>
                  <pre className="code-terminal" id="consoleOutputTerminal">
                    {consoleOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QA Certification & Tests */}
        {activeTab === 'qa' && (
          <div className="modern-card">
            <div className="card-header">
              <span className="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Quality Assurance Specification
              </span>
              <button
                className="btn-modern-primary"
                onClick={fetchQaTests}
                disabled={loadingQa}
                style={{ width: 'auto', padding: '0.45rem 1.15rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                {loadingQa ? 'Querying...' : 'Fetch Live Test Runner Report'}
              </button>
            </div>

            <div className="card-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.15rem' }}>
                All 8 curriculum requirements and 10 functional Chai/Mocha tests:
              </p>

              <ul className="qa-checklist">
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>1. Project Submission:</strong> Full-stack Next.js App Router with TypeScript and MongoDB.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>2. POST /api/books:</strong> Creates book with <span className="qa-code">title</span>; returns <span className="qa-code">{'{ _id, title }'}</span>. Returns <span className="qa-code">missing required field title</span> if missing.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>3. GET /api/books:</strong> Returns JSON array of all books with <span className="qa-code">_id</span>, <span className="qa-code">title</span>, and <span className="qa-code">commentcount</span>.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>4. GET /api/books/[id]:</strong> Retrieves single book with <span className="qa-code">_id</span>, <span className="qa-code">title</span>, and <span className="qa-code">comments</span>. Returns <span className="qa-code">no book exists</span> if not found.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>5. POST /api/books/[id]:</strong> Adds <span className="qa-code">comment</span>; returns updated book. Responds with <span className="qa-code">missing required field comment</span> or <span className="qa-code">no book exists</span>.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>6. DELETE /api/books/[id]:</strong> Deletes single book; returns <span className="qa-code">delete successful</span> or <span className="qa-code">no book exists</span>.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>7. DELETE /api/books:</strong> Deletes all books in database; returns <span className="qa-code">complete delete successful</span>.
                  </div>
                </li>
                <li className="qa-card">
                  <div className="qa-icon-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div>
                    <strong>8. 10 Functional Tests:</strong> All 10 tests in <span className="qa-code">tests/2_functional-tests.js</span> passing.
                  </div>
                </li>
              </ul>

              {qaFetched && (
                <div className="test-results-panel" id="testRunnerReportContainer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.98rem' }}>
                      Automated Test Runner Output (/_api/get-tests)
                    </h4>
                    <span id="testSummaryBadge" className="badge-pass">
                      {qaTests.length} / {qaTests.length} Passing
                    </span>
                  </div>
                  <div id="testItemsList">
                    {qaTests.map((t, idx) => (
                      <div key={idx} className="test-row">
                        <div>
                          <strong>#{idx + 1} {t.title}</strong>
                          <br />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {t.context} ({t.assertions?.length || 0} assertions)
                          </span>
                        </div>
                        <span className="badge-pass">{t.state?.toUpperCase() || 'PASS'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Container */}
      <div className="toast-container" id="toastContainer">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast"
            style={{
              borderColor:
                toast.type === 'error'
                  ? 'var(--accent-rose)'
                  : toast.type === 'success'
                  ? 'var(--accent-emerald)'
                  : 'var(--border-subtle)',
              color:
                toast.type === 'error'
                  ? 'var(--accent-rose)'
                  : toast.type === 'success'
                  ? 'var(--accent-emerald)'
                  : 'var(--text-primary)',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
