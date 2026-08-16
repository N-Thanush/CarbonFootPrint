import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api';
import AdminCategories from './admin/AdminCategories';
import AdminActivityTypes from './admin/AdminActivityTypes';
import AdminEmissionFactors from './admin/AdminEmissionFactors';
import AdminActivityLogs from './admin/AdminActivityLogs';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZES = [10, 50, 100];
const MAIN_NAVS = [
  { id: 'users', label: 'User Management', icon: 'users' },
  { id: 'categories', label: 'Activity Categories', icon: 'category' },
  { id: 'activityTypes', label: 'Activity Types', icon: 'type' },
  { id: 'emissionFactors', label: 'Emission Factors', icon: 'factor' },
  { id: 'activityLogs', label: 'Activity Logs', icon: 'log' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync active main tab navigation with URL search params (?tab=...)
  const tabParam = searchParams.get('tab');
  const activeNav = MAIN_NAVS.some((n) => n.id === tabParam) ? tabParam : 'users';

  const handleNavChange = (navId) => {
    if (navId === 'users') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: navId });
    }
  };

  const [selectedCategoryForTypes, setSelectedCategoryForTypes] = useState('');

  // Auth
  const [token] = useState(() => localStorage.getItem('token'));
  const [adminUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  // Column Sorting state
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Redirect if not admin or missing token
  useEffect(() => {
    if (!token || !adminUser || adminUser.role !== 'ADMIN') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  }, [token, adminUser, navigate]);

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

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
  // View user details popup modal state
  const [viewUserModal, setViewUserModal] = useState(null);
  // Confirm logout popup modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // View document preview popup modal state
  const [viewDocumentModal, setViewDocumentModal] = useState(null);

  // SVG Sort Icon Helper
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.35, marginLeft: '6px', verticalAlign: 'middle' }}>
          <path d="M7 15l5 5 5-5H7z" />
          <path d="M7 9l5-5 5 5H7z" />
        </svg>
      );
    }
    if (sortOrder === 'asc') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#2E7D32', marginLeft: '6px', verticalAlign: 'middle' }}>
          <path d="M7 14l5-5 5 5H7z" />
        </svg>
      );
    }
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#2E7D32', marginLeft: '6px', verticalAlign: 'middle' }}>
        <path d="M7 10l5 5 5-5H7z" />
      </svg>
    );
  };

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
      await adminApi.approveUser(token, userId);
      setSuccessMsg(`User "${userName}" approved successfully! Notification email sent.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to approve user');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  const handleReject = async (userId, userName) => {
    setActionLoading((prev) => ({ ...prev, [userId]: 'reject' }));
    setError('');
    setSuccessMsg('');
    try {
      await adminApi.rejectUser(token, userId);
      setSuccessMsg(`User "${userName}" rejected. Status updated.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to reject user');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmUser) return;
    const { id: userId, fullName: userName } = deleteConfirmUser;
    setDeleteConfirmUser(null);
    setActionLoading((prev) => ({ ...prev, [userId]: 'delete' }));
    setError('');
    setSuccessMsg('');
    try {
      await adminApi.deleteUser(token, userId);
      setSuccessMsg(`User "${userName}" deleted permanently.`);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: null }));
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Sorted & Filtered Users
  const sortedAndFilteredUsers = users
    .filter((u) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.organization?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.accountStatus?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
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
            <strong>Admin Dashboard</strong>
            <span>Carbon Footprint</span>
          </div>
        </div>

        <div className="mat-sidebar-divider" />

        <nav className="mat-sidebar-nav">
          {MAIN_NAVS.map((nav) => (
            <button
              key={nav.id}
              className={`mat-nav-item ${activeNav === nav.id ? 'active' : ''}`}
              onClick={() => handleNavChange(nav.id)}
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
              <span>Admin</span> / <span className="active-path">{MAIN_NAVS.find(n => n.id === activeNav)?.label}</span>
            </div>
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

            <button className="mat-btn-logout" onClick={() => setShowLogoutModal(true)} title="Logout">
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
          {activeNav === 'categories' && (
            <AdminCategories
              token={token}
              onNavigateToTypes={(category) => {
                setSelectedCategoryForTypes(category.id);
                handleNavChange('activityTypes');
              }}
            />
          )}
          {activeNav === 'activityTypes' && (
            <AdminActivityTypes
              token={token}
              initialCategoryId={selectedCategoryForTypes}
            />
          )}
          {activeNav === 'emissionFactors' && <AdminEmissionFactors token={token} />}
          {activeNav === 'activityLogs' && <AdminActivityLogs token={token} />}

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
                <div className={`mat-table-responsive ${pageSize >= 50 ? 'table-scroll-large' : ''}`}>
                  <table className="mat-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleSort('fullName')} style={{ cursor: 'pointer', userSelect: 'none', width: '22%' }} title="Click to sort by Name">
                          User Profile {renderSortIcon('fullName')}
                        </th>
                        <th onClick={() => handleSort('phone')} style={{ cursor: 'pointer', userSelect: 'none', width: '13%' }} title="Click to sort by Contact">
                          Contact {renderSortIcon('phone')}
                        </th>
                        <th onClick={() => handleSort('organization')} style={{ cursor: 'pointer', userSelect: 'none', width: '16%' }} title="Click to sort by Organization">
                          Organization {renderSortIcon('organization')}
                        </th>
                        <th onClick={() => handleSort('documentType')} style={{ cursor: 'pointer', userSelect: 'none', width: '15%' }} title="Click to sort by Document Type">
                          Document Proof {renderSortIcon('documentType')}
                        </th>
                        <th onClick={() => handleSort('accountStatus')} style={{ cursor: 'pointer', userSelect: 'none', width: '11%' }} title="Click to sort by Status">
                          Status {renderSortIcon('accountStatus')}
                        </th>
                        <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', userSelect: 'none', width: '13%' }} title="Click to sort by Registration Date">
                          Registered Date {renderSortIcon('createdAt')}
                        </th>
                        <th style={{ textAlign: 'right', width: '10%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="mat-empty-td">
                            <span className="mat-spinner" /> Loading users...
                          </td>
                        </tr>
                      ) : sortedAndFilteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="mat-empty-td">
                            <p>No user records found matching criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        sortedAndFilteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div className="mat-user-cell">
                                <div className="mat-user-avatar">{user.fullName?.charAt(0).toUpperCase()}</div>
                                <div className="mat-user-meta">
                                  <strong>{user.fullName}</strong>
                                  <span>{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="mat-text-cell">
                                <strong style={{ fontWeight: 500 }}>{user.phone || '—'}</strong>
                              </div>
                            </td>
                            <td>
                              <div className="mat-text-cell">
                                <strong>{user.organization || 'Individual'}</strong>
                                <span>{user.industryType || 'N/A'}</span>
                              </div>
                            </td>
                            <td>
                              <div className="mat-doc-box">
                                <span className="mat-doc-badge">{user.documentType || 'PROOF'}</span>
                                {user.documentFileUrl ? (
                                  <button
                                     type="button"
                                     className="mat-btn-doc-link"
                                     style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                                     onClick={() => setViewDocumentModal({
                                       url: user.documentFileUrl,
                                       userName: user.fullName,
                                       docType: user.documentType || 'PROOF',
                                       docNumber: user.documentNumber || 'N/A'
                                     })}
                                   >
                                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                       <path d="M14 2H6a2 2 0 0 1-2 2v16a2 2 0 0 1 2 2h12a2 2 0 0 1 2-2V8z" />
                                       <polyline points="14 2 14 8 20 8" />
                                     </svg>
                                     View Document
                                   </button>
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
                                <button
                                  className="mat-btn-act act-view"
                                  onClick={() => setViewUserModal(user)}
                                  title="View Detailed Profile"
                                  style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', fontWeight: 600 }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                  Details
                                </button>

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

      {/* ===== VIEW USER DETAILS MODAL WITH DARK THEME ===== */}
      {viewUserModal && (
        <div className="mat-modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.85)', position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mat-modal-card" style={{ width: '100%', maxWidth: '540px', background: '#1E293B', border: '1px solid #334155', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)', color: '#F8FAFC', maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1px solid #334155', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div className="mat-user-avatar" style={{ width: '42px', height: '42px', fontSize: '1.125rem', background: '#10B981', color: '#0F172A', fontWeight: 800 }}>
                  {viewUserModal.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#F8FAFC', fontWeight: 800 }}>{viewUserModal.fullName}</h3>
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{viewUserModal.email}</span>
                </div>
              </div>
              <button
                onClick={() => setViewUserModal(null)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.125rem', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Essential Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem', marginBottom: '1.25rem' }}>
              <div className="mat-detail-box" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 0.875rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Account Status</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <span className={`mat-status-pill status-${viewUserModal.accountStatus?.toLowerCase()}`}>
                    {viewUserModal.accountStatus}
                  </span>
                </div>
              </div>

              <div className="mat-detail-box" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 0.875rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Organization</span>
                <div style={{ marginTop: '0.2rem', fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>{viewUserModal.organization || 'Individual'}</div>
              </div>

              <div className="mat-detail-box" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 0.875rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Industry</span>
                <div style={{ marginTop: '0.2rem', fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>{viewUserModal.industryType || 'N/A'}</div>
              </div>

              <div className="mat-detail-box" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 0.875rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Country & State</span>
                <div style={{ marginTop: '0.2rem', fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>
                  {viewUserModal.state ? `${viewUserModal.state}, ` : ''}{viewUserModal.country || 'India'}
                </div>
              </div>

              <div className="mat-detail-box" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 0.875rem', borderRadius: '12px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Full Address</span>
                <div style={{ marginTop: '0.2rem', fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>{viewUserModal.address || 'N/A'}</div>
              </div>

              <div className="mat-detail-box" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 0.875rem', borderRadius: '12px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Identity Proof Document</span>
                <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ color: '#34D399', fontSize: '0.875rem' }}>{viewUserModal.documentType || 'PAN / AADHAAR'}</strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8' }}>No: {viewUserModal.documentNumber || 'N/A'}</span>
                  </div>
                  {viewUserModal.documentFileUrl ? (
                    <button
                      type="button"
                      className="mat-btn-doc-link"
                      style={{ background: '#10B981', color: '#0F172A', padding: '0.375rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                      onClick={() => setViewDocumentModal({
                        url: viewUserModal.documentFileUrl,
                        userName: viewUserModal.fullName,
                        docType: viewUserModal.documentType || 'PROOF',
                        docNumber: viewUserModal.documentNumber || 'N/A'
                      })}
                    >
                      📄 View Proof File
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>No file attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.875rem', borderTop: '1px solid #334155' }}>
              <button className="mat-btn-secondary" onClick={() => setViewUserModal(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                Close
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {viewUserModal.accountStatus === 'PENDING' && (
                  <>
                    <button className="mat-btn-act act-approve" onClick={() => { handleApprove(viewUserModal.id, viewUserModal.fullName); setViewUserModal(null); }}>
                      Approve
                    </button>
                    <button className="mat-btn-act act-reject" onClick={() => { handleReject(viewUserModal.id, viewUserModal.fullName); setViewUserModal(null); }}>
                      Reject
                    </button>
                  </>
                )}
                <button className="mat-btn-act act-delete" onClick={() => { setDeleteConfirmUser(viewUserModal); setViewUserModal(null); }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              Are you sure you want to permanently delete user <strong>"{deleteConfirmUser.fullName}"</strong>?
              This action cannot be undone.
            </p>
            <div className="mat-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmUser(null)}>
                Cancel
              </button>
              <button className="mat-btn-danger" onClick={handleDeleteConfirmed}>
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRM LOGOUT MODAL ===== */}
      {showLogoutModal && (
        <div className="mat-modal-overlay">
          <div className="mat-modal-card">
            <div className="mat-modal-icon icon-danger" style={{ background: '#FFF3E0', borderColor: '#FFE0B2' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F57C00" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your session?</p>
            <div className="mat-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button
                className="mat-btn-danger"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DOCUMENT PREVIEW POPUP MODAL ===== */}
      {viewDocumentModal && (
        <div className="mat-modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.85)', position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mat-modal-card" style={{ width: '100%', maxWidth: '820px', background: '#1E293B', border: '1px solid #334155', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)', color: '#F8FAFC', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.875rem', borderBottom: '1px solid #334155', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#F8FAFC', fontWeight: 800 }}>
                    {viewDocumentModal.docType} Identity Proof
                  </h3>
                  <span className="mat-doc-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {viewDocumentModal.userName}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Document No: {viewDocumentModal.docNumber}</span>
              </div>
              <button
                onClick={() => setViewDocumentModal(null)}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.125rem', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Document Viewer Frame */}
            <div style={{ flex: 1, minHeight: '450px', background: '#0F172A', borderRadius: '14px', border: '1px solid #334155', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {viewDocumentModal.url ? (
                <iframe
                  src={viewDocumentModal.url}
                  title="Document Preview"
                  style={{ width: '100%', height: '100%', minHeight: '450px', border: 'none' }}
                />
              ) : (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '2rem' }}>
                  No document URL attached for this user.
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid #334155' }}>
              <a
                href={viewDocumentModal.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.8125rem', color: '#60A5FA', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
              >
                ↗ Open in Full Window / Tab
              </a>
              <button
                className="mat-btn-secondary"
                onClick={() => setViewDocumentModal(null)}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600 }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION (TOP-RIGHT) */}
      {(successMsg || error) && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderLeft: successMsg ? '4px solid #10B981' : '4px solid #EF4444',
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
            {successMsg ? `✓ ${successMsg}` : `✕ ${error}`}
          </span>
          <button
            onClick={() => { setSuccessMsg(''); setError(''); }}
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
