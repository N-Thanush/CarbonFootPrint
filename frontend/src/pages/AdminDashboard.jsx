import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import AdminCategories from './admin/AdminCategories';
import AdminActivityTypes from './admin/AdminActivityTypes';
import AdminEmissionFactors from './admin/AdminEmissionFactors';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZES = [10, 50, 100];
const MAIN_NAVS = [
  { id: 'users', label: 'User Approvals' },
  { id: 'categories', label: 'Categories' },
  { id: 'activityTypes', label: 'Activity Types' },
  { id: 'emissionFactors', label: 'Emission Factors' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Active main tab navigation
  const [activeNav, setActiveNav] = useState('users');

  // Auth
  const [token] = useState(() => localStorage.getItem('token'));
  const [adminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // Table state
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Track which user IDs have an action in-progress
  const [actionLoading, setActionLoading] = useState({});

  // Redirect if not admin
  useEffect(() => {
    if (!token || !adminUser || adminUser.role !== 'ADMIN') {
      navigate('/login', { replace: true });
    }
  }, [token, adminUser, navigate]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers(token, {
        status: statusFilter,
        page: currentPage,
        size: pageSize,
      });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page when filter or page size changes
  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(0);
    setSuccessMsg('');
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(0);
  };

  // Actions
  const handleApprove = async (userId, userName) => {
    setActionLoading((prev) => ({ ...prev, [userId]: 'approve' }));
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminApi.approveUser(token, userId);
      setSuccessMsg(res.message || `${userName} approved!`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to approve user');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    }
  };

  const handleReject = async (userId, userName) => {
    setActionLoading((prev) => ({ ...prev, [userId]: 'reject' }));
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminApi.rejectUser(token, userId);
      setSuccessMsg(res.message || `${userName} rejected.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to reject user');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Page range info
  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="admin-page">
      {/* ===== Header ===== */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div>
            <h1 className="admin-header-title">Admin Dashboard</h1>
            <p className="admin-header-sub">Carbon Footprint Tracker · User Management</p>
          </div>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{adminUser?.fullName || 'Admin'}</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="admin-main">
        {/* Main Nav Tabs */}
        <div className="admin-main-nav">
          {MAIN_NAVS.map((nav) => (
            <button
              key={nav.id}
              className={`main-nav-btn ${activeNav === nav.id ? 'active' : ''}`}
              onClick={() => setActiveNav(nav.id)}
            >
              {nav.label}
            </button>
          ))}
        </div>

        {activeNav === 'categories' && <AdminCategories token={token} />}
        {activeNav === 'activityTypes' && <AdminActivityTypes token={token} />}
        {activeNav === 'emissionFactors' && <AdminEmissionFactors token={token} />}

        {activeNav === 'users' && (
          <>
            {/* Stats bar */}
            <div className="admin-stats-bar">
              <div className="admin-stat">
                <span className="admin-stat-value">{totalElements}</span>
                <span className="admin-stat-label">
                  {statusFilter === 'ALL' ? 'Total Users' : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Users`}
                </span>
              </div>
            </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="admin-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase()}`}
              className={`admin-tab ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => handleStatusChange(tab)}
            >
              <span className={`tab-dot tab-dot-${tab.toLowerCase()}`}></span>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div className="admin-table-card">
          {/* Top controls */}
          <div className="admin-table-controls">
            <div className="admin-page-size">
              <label htmlFor="page-size-select">Show</label>
              <select
                id="page-size-select"
                className="admin-select"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>entries</span>
            </div>
            <div className="admin-record-info">
              {totalElements > 0
                ? `Showing ${startRecord}–${endRecord} of ${totalElements}`
                : 'No records found'}
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Document</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="admin-table-empty">
                      <div className="admin-table-loader">
                        <span className="spinner"></span>
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="admin-table-empty">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: '0.5rem' }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p>No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} users found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="td-id">{user.id}</td>
                      <td className="td-name">
                        <div className="user-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                        {user.fullName}
                      </td>
                      <td className="td-email">{user.email}</td>
                      <td>{user.phone || '—'}</td>
                      <td>
                        <span className="doc-badge">{user.documentType}</span>
                        <span className="doc-number">{user.documentNumber}</span>
                      </td>
                      <td>{user.organization || '—'}</td>
                      <td>
                        <span className={`status-badge status-${user.accountStatus?.toLowerCase()}`}>
                          {user.accountStatus}
                        </span>
                      </td>
                      <td className="td-date">{formatDateTime(user.createdAt)}</td>
                      <td className="td-actions">
                        {user.accountStatus === 'PENDING' ? (
                          <>
                            <button
                              className="action-btn action-approve"
                              disabled={!!actionLoading[user.id]}
                              onClick={() => handleApprove(user.id, user.fullName)}
                            >
                              {actionLoading[user.id] === 'approve' ? (
                                <span className="spinner-sm"></span>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                              Approve
                            </button>
                            <button
                              className="action-btn action-reject"
                              disabled={!!actionLoading[user.id]}
                              onClick={() => handleReject(user.id, user.fullName)}
                            >
                              {actionLoading[user.id] === 'reject' ? (
                                <span className="spinner-sm"></span>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              )}
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="action-done">
                            {user.accountStatus === 'APPROVED' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="admin-pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(0)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="11 17 6 12 11 7" />
                  <polyline points="18 17 13 12 18 7" />
                </svg>
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="pagination-pages">
                {generatePageNumbers(currentPage, totalPages).map((pg, idx) =>
                  pg === '...' ? (
                    <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                  ) : (
                    <button
                      key={pg}
                      className={`pagination-page ${currentPage === pg ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pg)}
                    >
                      {pg + 1}
                    </button>
                  )
                )}
              </div>

              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(totalPages - 1)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="13 17 18 12 13 7" />
                  <polyline points="6 17 11 12 6 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        </>
        )}
      </main>
    </div>
  );
}

/**
 * Generates an array of page numbers to display, with ellipses for large ranges.
 * E.g. [0, 1, '...', 8, 9] for currentPage=0, totalPages=10
 */
function generatePageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages = new Set();
  // Always show first and last
  pages.add(0);
  pages.add(total - 1);
  // Show current and neighbors
  for (let i = Math.max(0, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('...');
    }
    result.push(sorted[i]);
  }
  return result;
}
