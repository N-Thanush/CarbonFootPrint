import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import AdminCategories from './admin/AdminCategories';
import AdminActivityTypes from './admin/AdminActivityTypes';
import AdminEmissionFactors from './admin/AdminEmissionFactors';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZES = [10, 50, 100];
const MAIN_NAVS = [
  { id: 'users', label: 'User Management', icon: 'users' },
  { id: 'categories', label: 'Activity Categories', icon: 'category' },
  { id: 'activityTypes', label: 'Activity Types', icon: 'type' },
  { id: 'emissionFactors', label: 'Emission Factors', icon: 'factor' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Statistics counters
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Track action loading per user ID
  const [actionLoading, setActionLoading] = useState({});

  // Confirm delete modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

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

      // Fetch status counts for material stat cards
      const [pendingRes, approvedRes, rejectedRes, allRes] = await Promise.all([
        adminApi.getUsers(token, { status: 'PENDING', page: 0, size: 1 }),
        adminApi.getUsers(token, { status: 'APPROVED', page: 0, size: 1 }),
        adminApi.getUsers(token, { status: 'REJECTED', page: 0, size: 1 }),
        adminApi.getUsers(token, { status: 'ALL', page: 0, size: 1 }),
      ]);
      setStats({
        total: allRes.totalElements || 0,
        pending: pendingRes.totalElements || 0,
        approved: approvedRes.totalElements || 0,
        rejected: rejectedRes.totalElements || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    if (activeNav === 'users') {
      fetchUsers();
    }
  }, [fetchUsers, activeNav]);

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
      setSuccessMsg(res.message || `${userName} approved successfully!`);
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

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    const { id: userId, fullName: userName } = deleteConfirmUser;
    setActionLoading((prev) => ({ ...prev, [userId]: 'delete' }));
    setError('');
    setSuccessMsg('');
    setDeleteConfirmUser(null);
    try {
      const res = await adminApi.deleteUser(token, userId);
      setSuccessMsg(res.message || `User '${userName}' deleted successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user record');
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Filtered users for search query
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.organization?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="mat-dashboard-layout">
      {/* ===== MATERIAL SIDEBAR ===== */}
      <aside className="mat-sidebar">
        <div className="mat-sidebar-header">
          <div className="mat-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div className="mat-brand-text">
            <strong>Material Admin</strong>
            <span>Carbon Footprint</span>
          </div>
        </div>

        <div className="mat-sidebar-divider" />

        <nav className="mat-sidebar-nav">
          {MAIN_NAVS.map((nav) => (
            <button
              key={nav.id}
              className={`mat-nav-item ${activeNav === nav.id ? 'active' : ''}`}
              onClick={() => setActiveNav(nav.id)}
            >
              <div className="mat-nav-icon">
                {nav.icon === 'users' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {nav.icon === 'category' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                )}
                {nav.icon === 'type' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                )}
                {nav.icon === 'factor' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
              </div>
              <span>{nav.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="mat-main-wrapper">
        {/* Top Navbar */}
        <header className="mat-navbar">
          <div className="mat-navbar-left">
            <div className="mat-breadcrumbs">
              <span>Pages</span> / <span className="active-path">{MAIN_NAVS.find(n => n.id === activeNav)?.label}</span>
            </div>
            <h2 className="mat-page-title">{MAIN_NAVS.find(n => n.id === activeNav)?.label}</h2>
          </div>

          <div className="mat-navbar-right">
            {activeNav === 'users' && (
              <div className="mat-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Type to search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <div className="mat-user-profile">
              <div className="mat-avatar">{adminUser?.fullName?.charAt(0).toUpperCase() || 'A'}</div>
              <span>{adminUser?.fullName || 'Admin'}</span>
            </div>

            <button className="mat-btn-logout" onClick={handleLogout} title="Logout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Section */}
        <main className="mat-content">
          {activeNav === 'categories' && <AdminCategories token={token} />}
          {activeNav === 'activityTypes' && <AdminActivityTypes token={token} />}
          {activeNav === 'emissionFactors' && <AdminEmissionFactors token={token} />}

          {activeNav === 'users' && (
            <>
              {/* ===== MATERIAL STAT CARDS ===== */}
              <div className="mat-stats-grid">
                <div className="mat-stat-card card-total" onClick={() => handleStatusChange('ALL')}>
                  <div className="mat-stat-icon icon-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="mat-stat-details">
                    <span>Total Registrations</span>
                    <h3>{stats.total}</h3>
                  </div>
                </div>

                <div className="mat-stat-card card-pending" onClick={() => handleStatusChange('PENDING')}>
                  <div className="mat-stat-icon icon-orange">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="mat-stat-details">
                    <span>Pending Approvals</span>
                    <h3>{stats.pending}</h3>
                  </div>
                </div>

                <div className="mat-stat-card card-approved" onClick={() => handleStatusChange('APPROVED')}>
                  <div className="mat-stat-icon icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="mat-stat-details">
                    <span>Approved Users</span>
                    <h3>{stats.approved}</h3>
                  </div>
                </div>

                <div className="mat-stat-card card-rejected" onClick={() => handleStatusChange('REJECTED')}>
                  <div className="mat-stat-icon icon-pink">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div className="mat-stat-details">
                    <span>Rejected Requests</span>
                    <h3>{stats.rejected}</h3>
                  </div>
                </div>
              </div>

              {/* Alert Banners */}
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
                  <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ===== MATERIAL USER TABLE CARD ===== */}
              <div className="mat-card-table">
                {/* Header Banner */}
                <div className="mat-card-header">
                  <div className="mat-card-header-title">
                    <h4>User Account Requests</h4>
                    <p>Manage user registration approvals, identity proof verification, and record deletions</p>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="mat-filter-tabs">
                    {STATUS_TABS.map((t) => (
                      <button
                        key={t}
                        className={`mat-filter-tab ${statusFilter === t ? 'active' : ''}`}
                        onClick={() => handleStatusChange(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Top Controls */}
                <div className="mat-table-controls">
                  <div className="mat-page-size">
                    <label>Show</label>
                    <select value={pageSize} onChange={handlePageSizeChange}>
                      {PAGE_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <span>entries per page</span>
                  </div>
                  <div className="mat-record-info">
                    {totalElements > 0
                      ? `Showing ${startRecord}–${endRecord} of ${totalElements} records`
                      : 'No records found'}
                  </div>
                </div>

                {/* Table */}
                <div className="mat-table-responsive">
                  <table className="mat-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User Profile</th>
                        <th>Contact</th>
                        <th>Organization</th>
                        <th>Document Proof</th>
                        <th>Status</th>
                        <th>Registered Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="mat-empty-td">
                            <span className="mat-spinner" /> Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="mat-empty-td">
                            <p>No user records found matching criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="mat-td-id">#{user.id}</td>
                            <td className="mat-td-user">
                              <div className="mat-user-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                              <div className="mat-user-meta">
                                <strong>{user.fullName}</strong>
                                <span>{user.email}</span>
                              </div>
                            </td>
                            <td className="mat-td-text">{user.phone || '—'}</td>
                            <td className="mat-td-text">
                              <strong>{user.organization || 'Individual'}</strong>
                              <span>{user.industryType || 'N/A'}</span>
                            </td>
                            <td>
                              <div className="mat-doc-box">
                                <span className="mat-doc-badge">{user.documentType || 'PROOF'}</span>
                                {user.documentFileUrl ? (
                                  <a
                                    href={user.documentFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mat-btn-doc-link"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    View Document
                                  </a>
                                ) : (
                                  <span className="mat-no-doc">No file attached</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`mat-status-pill status-${user.accountStatus?.toLowerCase()}`}>
                                {user.accountStatus}
                              </span>
                            </td>
                            <td className="mat-td-date">{formatDateTime(user.createdAt)}</td>
                            <td className="mat-td-actions">
                              <div className="mat-action-group">
                                {user.accountStatus === 'PENDING' && (
                                  <>
                                    <button
                                      className="mat-btn-act act-approve"
                                      disabled={!!actionLoading[user.id]}
                                      onClick={() => handleApprove(user.id, user.fullName)}
                                      title="Approve User"
                                    >
                                      {actionLoading[user.id] === 'approve' ? (
                                        <span className="mat-spinner-sm" />
                                      ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      )}
                                      Approve
                                    </button>
                                    <button
                                      className="mat-btn-act act-reject"
                                      disabled={!!actionLoading[user.id]}
                                      onClick={() => handleReject(user.id, user.fullName)}
                                      title="Reject User"
                                    >
                                      {actionLoading[user.id] === 'reject' ? (
                                        <span className="mat-spinner-sm" />
                                      ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                          <line x1="18" y1="6" x2="6" y2="18" />
                                          <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                      )}
                                      Reject
                                    </button>
                                  </>
                                )}

                                {/* DELETE ACTION BUTTON */}
                                <button
                                  className="mat-btn-act act-delete"
                                  disabled={!!actionLoading[user.id]}
                                  onClick={() => setDeleteConfirmUser(user)}
                                  title="Delete User Record"
                                >
                                  {actionLoading[user.id] === 'delete' ? (
                                    <span className="mat-spinner-sm" />
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      <line x1="10" y1="11" x2="10" y2="17" />
                                      <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                  )}
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                  <div className="mat-pagination">
                    <button
                      className="mat-page-btn"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(0)}
                    >
                      First
                    </button>
                    <button
                      className="mat-page-btn"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    >
                      &larr; Prev
                    </button>
                    <span className="mat-page-current">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      className="mat-page-btn"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Next &rarr;
                    </button>
                    <button
                      className="mat-page-btn"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage(totalPages - 1)}
                    >
                      Last
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ===== CONFIRM DELETE MODAL ===== */}
      {deleteConfirmUser && (
        <div className="mat-modal-overlay">
          <div className="mat-modal-card">
            <div className="mat-modal-icon icon-danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="12" y1="9" x2="12" y2="15" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3>Delete User Record</h3>
            <p>
              Are you sure you want to permanently delete user record for <strong>{deleteConfirmUser.fullName}</strong> ({deleteConfirmUser.email})?
              This action cannot be undone.
            </p>
            <div className="mat-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmUser(null)}>
                Cancel
              </button>
              <button className="mat-btn-danger" onClick={handleDelete}>
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
