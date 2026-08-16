import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';

const PAGE_SIZES = [10, 50, 100];

// Helper function to format ISO dates to DD-MM-YYYY
const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '—';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  }
  return dateStr;
};

// Helper function to format timestamp with time
const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
};

export default function AdminActivityLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories(token, { page: 0, size: 100 });
      setCategories(res.content || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [token]);

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getActivityLogs(token, { page: currentPage, size: pageSize });
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    const matchesCategory = selectedCatFilter
      ? String(l.categoryName || '').toLowerCase().includes(selectedCatFilter.toLowerCase())
      : true;

    const matchesDate = dateFilter
      ? (l.activityDate && l.activityDate.startsWith(dateFilter)) ||
        (l.activityDateIso && l.activityDateIso.startsWith(dateFilter))
      : true;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      l.userFullName?.toLowerCase().includes(query) ||
      l.userEmail?.toLowerCase().includes(query) ||
      l.activityTypeName?.toLowerCase().includes(query) ||
      l.categoryName?.toLowerCase().includes(query) ||
      l.unit?.toLowerCase().includes(query) ||
      l.notes?.toLowerCase().includes(query);

    return matchesCategory && matchesDate && matchesSearch;
  });

  return (
    <div className="admin-sub-tab">
      <div className="admin-sub-header">
        <div>
          <h2 className="sub-title">Activity Logs & Audit Trail</h2>
          <p className="sub-desc">Comprehensive ledger of all user carbon activities, conversion factors, and recorded timestamps</p>
        </div>
      </div>

      {/* Toolbar with Search Box & Controls */}
      <div className="categories-toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search user name, email, activity type, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: searchQuery ? '2.2rem' : undefined }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {searchQuery && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94A3B8' }}>
              <span>Filtered by: <strong style={{ color: '#38BDF8' }}>"{searchQuery}"</strong></span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38BDF8',
                  borderRadius: '12px',
                  padding: '0.15rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <div className="admin-page-size" style={{ margin: 0 }}>
            <label htmlFor="log-date-filter" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Activity Date:
            </label>
            <input
              id="log-date-filter"
              type="date"
              className="admin-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ padding: '0.35rem 0.6rem' }}
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#F87171',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginLeft: '0.3rem',
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="admin-page-size" style={{ margin: 0 }}>
            <label htmlFor="log-cat-filter" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Category Filter:
            </label>
            <select
              id="log-cat-filter"
              className="admin-select"
              value={selectedCatFilter}
              onChange={(e) => {
                setSelectedCatFilter(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-page-size" style={{ margin: 0 }}>
            <label htmlFor="log-page-size" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Show
            </label>
            <select
              id="log-page-size"
              className="admin-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table Card */}
      <div className="admin-table-card">
        <div className={`admin-table-wrapper ${pageSize >= 50 ? 'table-scroll-large' : ''}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Activity Date</th>
                <th>Category</th>
                <th>Activity Type</th>
                <th>Quantity</th>
                <th>Factor (kg CO₂)</th>
                <th>Total Emission</th>
                <th>Notes</th>
                <th>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="admin-table-empty">
                    <div className="admin-table-loader">
                      <FaSpinner className="spinner-icon" /> Loading activity logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="admin-table-empty">
                    No activity logs recorded matching the criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const userInitial = (log.userFullName || log.userEmail || 'U').substring(0, 2).toUpperCase();

                  return (
                    <tr key={log.id}>
                      {/* User Column (Click to filter by this user) */}
                      <td>
                        <div
                          onClick={() => setSearchQuery(log.userEmail || log.userFullName || '')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            cursor: 'pointer',
                          }}
                          title={`Click to filter logs for ${log.userFullName || log.userEmail}`}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {userInitial}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {log.userFullName || 'User'}
                            </strong>
                            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                              {log.userEmail || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Activity Date */}
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatDateDDMMYYYY(log.activityDate || log.activityDateIso)}
                      </td>

                      {/* Category */}
                      <td>
                        <span className="doc-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                          {log.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Activity Type */}
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.activityTypeName}
                      </td>

                      {/* Quantity */}
                      <td>
                        <code>
                          {log.quantity} {log.unit}
                        </code>
                      </td>

                      {/* Factor */}
                      <td>{log.emissionFactor} kg/unit</td>

                      {/* Total Emission */}
                      <td>
                        <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>
                          {log.totalEmission} kg CO₂e
                        </strong>
                      </td>

                      {/* Notes */}
                      <td style={{ maxWidth: '200px', whiteSpace: 'normal', color: '#94A3B8', fontSize: '0.825rem' }}>
                        {log.notes || '—'}
                      </td>

                      {/* Logged At */}
                      <td style={{ color: '#64748B', fontSize: '0.8rem' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="admin-pagination">
            <button className="pagination-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>
              «
            </button>
            <button
              className="pagination-btn"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              ‹
            </button>
            <span className="pagination-pages">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              ›
            </button>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(totalPages - 1)}
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* FLOATING TOAST NOTIFICATION (TOP-RIGHT) */}
      {(success || error) && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderLeft: success ? '4px solid #10B981' : '4px solid #EF4444',
            color: '#F8FAFC',
            padding: '0.85rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            zIndex: 9999,
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            {success ? `✓ ${success}` : `✕ ${error}`}
          </span>
          <button
            onClick={() => {
              setSuccess('');
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              padding: '0 0 0 0.5rem',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
