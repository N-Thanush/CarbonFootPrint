import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi, authApi } from '../api';
import './UserDashboard.css';
import {
  FaCar,
  FaBolt,
  FaUtensils,
  FaShoppingBag,
  FaTrashAlt,
  FaTint,
  FaLeaf,
  FaSignOutAlt,
  FaHistory,
  FaCalculator,
  FaChartLine,
  FaCalendarAlt,
  FaCheck,
  FaEdit,
  FaTrash,
  FaUser,
  FaSpinner,
  FaSeedling,
  FaChevronRight,
  FaBoxes
} from 'react-icons/fa';

// Realistic Photography Banners
import transportImg from '../assets/Images/categories/transport.png';
import electricityImg from '../assets/Images/categories/electricity.png';
import foodImg from '../assets/Images/categories/food.png';
import shoppingImg from '../assets/Images/categories/shopping.png';
import wasteImg from '../assets/Images/categories/waste.png';
import waterImg from '../assets/Images/categories/water.png';

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

// Dynamic Category Theme & Realistic Image Mapper
const getCategoryTheme = (cat) => {
  const name = (cat.name || '').toLowerCase();
  const icon = (cat.iconName || '').toLowerCase();

  if (name.includes('transport') || icon.includes('car') || icon.includes('vehicle')) {
    return {
      image: transportImg,
      icon: <FaCar />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
    };
  }
  if (name.includes('electr') || name.includes('power') || name.includes('energy') || icon.includes('bolt')) {
    return {
      image: electricityImg,
      icon: <FaBolt />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    };
  }
  if (name.includes('food') || name.includes('meal') || name.includes('diet') || icon.includes('utensil')) {
    return {
      image: foodImg,
      icon: <FaUtensils />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    };
  }
  if (name.includes('shop') || name.includes('buy') || name.includes('retail') || icon.includes('bag')) {
    return {
      image: shoppingImg,
      icon: <FaShoppingBag />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    };
  }
  if (name.includes('waste') || icon.includes('trash') || icon.includes('recycle')) {
    return {
      image: wasteImg,
      icon: <FaTrashAlt />,
      color: cat.colorCode || '#14B8A6',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
    };
  }
  if (name.includes('water') || icon.includes('tint')) {
    return {
      image: waterImg,
      icon: <FaTint />,
      color: cat.colorCode || '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    };
  }

  return {
    image: transportImg,
    icon: <FaLeaf />,
    color: cat.colorCode || '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
  };
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  // Sync active tab with URL search parameter ?tab=
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'history' ? 'history' : 'log';

  // Sync selected category with URL search parameter ?catId=
  const categoryIdParam = searchParams.get('catId');

  const handleTabChange = (tabName) => {
    const newParams = new URLSearchParams(searchParams);
    if (tabName === 'log') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tabName);
    }
    setSearchParams(newParams);
  };

  // Categories & Activity Types for Card UX
  const [categories, setCategories] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedActivityType, setSelectedActivityType] = useState(null);

  // Form State for Log Activity
  const [logForm, setLogForm] = useState({
    quantity: 10,
    unit: 'km',
    activityDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Sample Emission Factors for live preview
  const [liveFactor, setLiveFactor] = useState(0.21);

  // History State
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editModalLog, setEditModalLog] = useState(null);
  const [deleteConfirmLog, setDeleteConfirmLog] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  // Fetch Profile & Auth Check
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    authApi
      .getProfile(token)
      .then((res) => {
        if (res) {
          setUser(res);
          localStorage.setItem('user', JSON.stringify(res));
        }
      })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      });
  }, [token, navigate]);

  // Fetch Categories for Card Grid
  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const res = await userApi.getCategories(token);
      setCategories(res.content || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [token]);

  // Fetch Activity Types
  const fetchActivityTypes = useCallback(
    async (catId) => {
      if (!token) return;
      try {
        const res = await userApi.getActivityTypes(token, catId);
        setActivityTypes(res.content || []);
      } catch (err) {
        console.error('Error fetching activity types:', err);
      }
    },
    [token]
  );

  // Sync selected category when URL search parameter catId changes or categories load
  useEffect(() => {
    if (categoryIdParam && categories.length > 0) {
      const matchedCat = categories.find((c) => String(c.id) === String(categoryIdParam));
      if (matchedCat) {
        setSelectedCategory(matchedCat);
        fetchActivityTypes(matchedCat.id);
      }
    } else if (!categoryIdParam) {
      setSelectedCategory(null);
    }
  }, [categoryIdParam, categories, fetchActivityTypes]);

  // Summary Stats estimation
  const [userStats, setUserStats] = useState({
    totalEmission: 0,
    totalCount: 0,
  });

  // Fetch Activity History
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await userApi.getActivityHistory(token, {
        date: historyDateFilter || undefined,
        categoryId: historyCategoryFilter || undefined,
        page: currentPage,
        size: pageSize,
      });
      setHistoryLogs(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);

      // Always fetch overall summary totals across all user activities
      userApi.getActivityHistory(token, { page: 0, size: 100 }).then((allRes) => {
        const logs = allRes.content || [];
        const sum = logs.reduce((acc, item) => acc + (item.totalEmission || 0), 0);
        setUserStats({
          totalEmission: sum,
          totalCount: allRes.totalElements || logs.length,
        });
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, historyDateFilter, historyCategoryFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
    fetchHistory();
  }, [fetchCategories, fetchHistory]);

  // Handle Category Card Click
  const handleSelectCategory = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('catId', String(cat.id));
    setSearchParams(newParams);
    setSelectedActivityType(null);
    fetchActivityTypes(cat.id);
  };

  // Handle Activity Type Card Click
  const handleSelectActivityType = (type) => {
    setSelectedActivityType(type);
    const defaultQty = type.defaultQuantity || 10;
    setLogForm((prev) => ({
      ...prev,
      quantity: defaultQty,
      unit: type.unit || 'unit',
    }));

    // Estimate live factor based on unit
    if (type.unit === 'km') setLiveFactor(0.21);
    else if (type.unit === 'kWh') setLiveFactor(0.85);
    else if (type.unit === 'kg') setLiveFactor(2.5);
    else if (type.unit === 'meal' || type.unit === 'meals') setLiveFactor(1.8);
    else setLiveFactor(0.5);
  };

  // Submit Activity Log
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedActivityType) {
      setError('Please select an activity type first');
      return;
    }

    const qty = Number(logForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }

    const actDate = logForm.activityDate && logForm.activityDate.trim() !== ''
      ? logForm.activityDate
      : new Date().toISOString().split('T')[0];

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        activityTypeId: selectedActivityType.id,
        quantity: qty,
        unit: logForm.unit || selectedActivityType.unit || 'unit',
        activityDate: actDate,
        notes: logForm.notes ? logForm.notes.trim() : '',
      };

      const res = await userApi.createActivityLog(token, payload);
      setSuccess(
        `Successfully logged ${res.quantity} ${res.unit} of ${res.activityTypeName}! Calculated Emission: ${res.totalEmission} kg CO₂e`
      );

      // Reset form & refresh stats
      setSelectedCategory(null);
      setSelectedActivityType(null);
      setLogForm({
        quantity: 10,
        unit: 'km',
        activityDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Log Confirmation Handler
  const handleConfirmDeleteLog = async () => {
    if (!deleteConfirmLog) return;
    const { id: logId, activityTypeName } = deleteConfirmLog;
    setDeleteConfirmLog(null);
    try {
      await userApi.deleteActivityLog(token, logId);
      setSuccess(`Activity log entry for '${activityTypeName || 'Activity'}' deleted successfully.`);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  // Save Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalLog) return;
    try {
      const payload = {
        activityTypeId: editModalLog.activityTypeId,
        quantity: Number(editModalLog.quantity),
        unit: editModalLog.unit,
        activityDate: editModalLog.activityDateIso || editModalLog.activityDate,
        notes: editModalLog.notes,
      };
      await userApi.updateActivityLog(token, editModalLog.id, payload);
      setSuccess('Activity log entry updated successfully');
      setEditModalLog(null);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const estimatedEmission = Number((logForm.quantity * liveFactor).toFixed(2));
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'CU';

  // Quick Stats total sum estimation
  const totalEmissionsSum = historyLogs.reduce((acc, item) => acc + (item.totalEmission || 0), 0);

  return (
    <div className="mat-dashboard-layout">
      {/* ===== MATERIAL USER SIDEBAR ===== */}
      <aside className="mat-sidebar">
        <div className="mat-sidebar-header">
          <div className="brand-icon-box">
            <FaSeedling />
          </div>
          <div className="mat-brand-text">
            <strong>Carbon Tracker</strong>
            <span style={{ color: '#34D399', fontWeight: 600 }}>User Portal</span>
          </div>
        </div>

        <div className="mat-sidebar-divider" />

        <nav className="mat-sidebar-nav">
          <button
            className={`mat-nav-item ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => handleTabChange('log')}
          >
            <div className="mat-nav-icon">
              <FaCalculator size={18} />
            </div>
            <span>Log Daily Activity</span>
          </button>

          <button
            className={`mat-nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <div className="mat-nav-icon">
              <FaHistory size={18} />
            </div>
            <span>Activity History</span>
          </button>
        </nav>

        {/* User Profile Card at Bottom of Sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div className="user-avatar-circle">{userInitials}</div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.fullName || 'Carbon User'}
              </span>
              <span style={{ fontSize: '0.725rem', color: '#94A3B8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.email || 'user@domain.com'}
              </span>
            </div>
          </div>

          <button
            className="mat-btn-logout"
            onClick={() => setShowLogoutModal(true)}
            title="Sign Out"
            style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.8rem', padding: '0.55rem' }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="mat-main-wrapper" style={{ padding: '1.75rem 2rem' }}>
        {/* Content Section */}
        <main className="mat-content" style={{ padding: 0 }}>
          {/* Welcome Banner */}
          <div className="portal-welcome-banner">
            <div className="welcome-text">
              <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋</h1>
              <p>Track your daily activities, calculate carbon emissions, and make a sustainable impact.</p>
            </div>

            <div className="portal-stats-row">
              <div className="mini-stat-card">
                <FaChartLine className="mini-stat-icon" />
                <div>
                  <div className="mini-stat-val">
                    {(userStats.totalCount > 0 ? userStats.totalEmission : totalEmissionsSum).toFixed(1)} kg
                  </div>
                  <div className="mini-stat-lbl">Total CO₂e Logged</div>
                </div>
              </div>
              <div className="mini-stat-card">
                <FaHistory className="mini-stat-icon" style={{ color: '#38BDF8' }} />
                <div>
                  <div className="mini-stat-val">
                    {userStats.totalCount || totalElements || historyLogs.length}
                  </div>
                  <div className="mini-stat-lbl">Activities Tracked</div>
                </div>
              </div>
            </div>
          </div>

        {/* Tab Navigation */}
        <div className="portal-tab-bar">
          <button
            className={`portal-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => handleTabChange('log')}
          >
            <FaCalculator /> Log Daily Activity
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <FaHistory /> Activity History & Analytics
          </button>
        </div>

        {/* TAB 1: LOG DAILY ACTIVITY */}
        {activeTab === 'log' && (
          <div className="portal-log-container">
            {/* STEP 1: CATEGORY SELECTION CARDS GRID */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div className="step-header">
                <div className="step-num-badge">1</div>
                <h3 className="step-title">Select Category</h3>
              </div>

              <div className="portal-category-grid">
                {categories.map((cat) => {
                  const theme = getCategoryTheme(cat);
                  const isSelected = selectedCategory?.id === cat.id;
                  const isInactive = cat.active === false;

                  return (
                    <div
                      key={cat.id}
                      className={`portal-category-card ${isSelected ? 'selected' : ''} ${isInactive ? 'inactive' : ''}`}
                      onClick={() => {
                        if (isInactive) return;
                        handleSelectCategory(cat);
                      }}
                      style={{
                        cursor: isInactive ? 'not-allowed' : 'pointer',
                        opacity: isInactive ? 0.45 : 1,
                        filter: isInactive ? 'grayscale(0.95)' : 'none',
                        background: isInactive ? '#0F172A' : undefined,
                        borderColor: isInactive ? '#334155' : undefined,
                        position: 'relative',
                      }}
                      title={isInactive ? `${cat.name} is inactive and cannot be selected` : `Select ${cat.name}`}
                    >
                      {/* Hero Image Banner */}
                      <div className="portal-card-hero">
                        <img
                          src={theme.image}
                          alt=""
                          aria-hidden="true"
                          className="portal-card-img"
                          style={{ filter: isInactive ? 'grayscale(1)' : 'none' }}
                        />
                        <div className="portal-card-hero-overlay">
                          <div className="portal-icon-box" style={{ background: isInactive ? '#334155' : theme.gradient }}>
                            {theme.icon}
                          </div>
                          <span
                            style={{
                              position: 'absolute',
                              top: '0.75rem',
                              right: '0.75rem',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              backgroundColor: isInactive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                              color: isInactive ? '#FCA5A5' : '#6EE7B7',
                              border: isInactive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            {isInactive ? 'Inactive' : 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="portal-card-content">
                        <h4 className="portal-card-title" style={{ color: isInactive ? '#94A3B8' : '#F8FAFC' }}>
                          {cat.name}
                        </h4>
                        <p className="portal-card-desc" style={{ color: isInactive ? '#64748B' : undefined }}>
                          {isInactive ? 'This category is currently inactive and disabled.' : cat.description || 'Log carbon activity under this category'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: ACTIVITY TYPE SELECTION */}
            {selectedCategory && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div className="step-header">
                  <div className="step-num-badge">2</div>
                  <h3 className="step-title">
                    Select Activity Type in <span style={{ color: '#34D399' }}>{selectedCategory.name}</span>
                  </h3>
                </div>

                <div className="portal-types-grid">
                  {activityTypes.map((type) => {
                    const isTypeSelected = selectedActivityType?.id === type.id;
                    const isTypeInactive = type.active === false;

                    return (
                      <div
                        key={type.id}
                        className={`portal-type-card ${isTypeSelected ? 'selected' : ''} ${isTypeInactive ? 'inactive' : ''}`}
                        onClick={() => {
                          if (isTypeInactive) return;
                          handleSelectActivityType(type);
                        }}
                        style={{
                          cursor: isTypeInactive ? 'not-allowed' : 'pointer',
                          opacity: isTypeInactive ? 0.45 : 1,
                          filter: isTypeInactive ? 'grayscale(0.95)' : 'none',
                          background: isTypeInactive ? '#0F172A' : undefined,
                          borderColor: isTypeInactive ? '#334155' : undefined,
                        }}
                        title={isTypeInactive ? `${type.name} is inactive and cannot be selected` : `Select ${type.name}`}
                      >
                        <h4 className="type-card-title" style={{ color: isTypeInactive ? '#94A3B8' : '#F8FAFC' }}>
                          {type.name}
                        </h4>
                        <span className="type-card-unit" style={{ color: isTypeInactive ? '#64748B' : undefined }}>
                          Unit: {type.unit || 'unit'} {isTypeInactive ? '(Inactive)' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3 POPUP MODAL: LOG & CALCULATE ACTIVITY */}
            {selectedActivityType && (
              <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.8)', position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedActivityType(null)}>
                <div
                  className="modal-content"
                  style={{ maxWidth: '640px', width: '100%', background: '#131C35', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)', color: '#F8FAFC' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div className="step-header" style={{ marginBottom: 0 }}>
                      <div className="step-num-badge" style={{ background: '#38BDF8', width: '32px', height: '32px', fontSize: '0.9rem' }}>
                        3
                      </div>
                      <div>
                        <h3 className="step-title" style={{ fontSize: '1.15rem', color: '#F8FAFC' }}>
                          Log Consumption & Calculate Emission
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                          For <strong style={{ color: '#38BDF8' }}>{selectedActivityType.name}</strong> in <span style={{ color: '#34D399' }}>{selectedCategory?.name}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedActivityType(null)}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        color: '#94A3B8',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleLogSubmit} className="log-form-grid">
                    <div>
                      <div className="form-group-custom">
                        <label>Activity Date *</label>
                        <input
                          className="form-input-custom"
                          type="date"
                          max={new Date().toISOString().split('T')[0]}
                          value={logForm.activityDate}
                          onChange={(e) => setLogForm({ ...logForm, activityDate: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group-custom" style={{ marginTop: '1rem' }}>
                        <label>
                          Quantity ({selectedActivityType.unit || 'unit'}) *
                        </label>
                        <input
                          className="form-input-custom"
                          type="number"
                          step="any"
                          min="0.01"
                          value={logForm.quantity}
                          onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group-custom" style={{ marginTop: '1rem' }}>
                        <label>Notes / Remarks (Optional)</label>
                        <input
                          className="form-input-custom"
                          type="text"
                          placeholder="e.g. Daily office commute via EV"
                          value={logForm.notes}
                          onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Live Emission Calculation Box inside Modal */}
                    <div className="emission-preview-card">
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Estimated Carbon Footprint
                      </div>
                      <div className="preview-val">{estimatedEmission}</div>
                      <div className="preview-unit">kg CO₂e</div>
                      <p style={{ fontSize: '0.75rem', color: '#CBD5E1', marginTop: '0.35rem' }}>
                        ({logForm.quantity || 0} {selectedActivityType.unit} × {liveFactor} kg CO₂e factor)
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                        <button
                          type="submit"
                          className="btn-submit"
                          disabled={loading}
                          style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', width: '100%' }}
                        >
                          {loading ? <FaSpinner className="spinner" /> : <FaCheck />} Log Activity Entry
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedActivityType(null)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94A3B8',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVITY HISTORY & ANALYTICS */}
        {activeTab === 'history' && (
          <div className="admin-sub-tab">
            <div className="admin-sub-header">
              <div>
                <h2 className="sub-title">Activity Log History</h2>
                <p className="sub-desc">Review your logged activities, track carbon footprint over time, and manage entries.</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="categories-toolbar">
              <div className="toolbar-left">
                <div className="admin-page-size">
                  <label htmlFor="history-cat-filter" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Category Filter:
                  </label>
                  <select
                    id="history-cat-filter"
                    className="admin-select"
                    value={historyCategoryFilter}
                    onChange={(e) => {
                      setHistoryCategoryFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-page-size">
                  <label htmlFor="history-date-filter" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Date Filter:
                  </label>
                  <input
                    id="history-date-filter"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    className="admin-select"
                    value={historyDateFilter}
                    onChange={(e) => {
                      setHistoryDateFilter(e.target.value);
                      setCurrentPage(0);
                    }}
                    style={{ padding: '0.35rem 0.6rem' }}
                  />
                  {historyDateFilter && (
                    <button
                      className="filter-pill"
                      onClick={() => setHistoryDateFilter('')}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Clear Date
                    </button>
                  )}
                </div>
              </div>

              <div className="toolbar-right">
                <div className="admin-page-size" style={{ margin: 0 }}>
                  <label htmlFor="history-page-size" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    Show
                  </label>
                  <select
                    id="history-page-size"
                    className="admin-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                  >
                    {[10, 50, 100].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="admin-table-card">
              <div className={`admin-table-wrapper ${pageSize >= 50 ? 'table-scroll-large' : ''}`}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Activity Type</th>
                      <th>Quantity</th>
                      <th>Emission (kg CO₂e)</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="admin-table-empty">
                          <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Loading history logs...
                        </td>
                      </tr>
                    ) : historyLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="admin-table-empty">
                          No activity history entries found matching criteria
                        </td>
                      </tr>
                    ) : (
                      historyLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatDateDDMMYYYY(log.activityDate)}</td>
                          <td>
                            <span className="doc-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                              {log.categoryName || 'General'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.activityTypeName}</td>
                          <td>
                            {log.quantity} {log.unit}
                          </td>
                          <td>
                            <strong style={{ color: '#34D399', fontSize: '0.95rem' }}>
                              {log.totalEmission} kg
                            </strong>
                          </td>
                          <td>{log.notes || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="action-btn action-approve"
                                onClick={() => setEditModalLog(log)}
                                title="Edit Entry"
                              >
                                <FaEdit /> Edit
                              </button>
                              <button
                                className="action-btn action-reject"
                                onClick={() => setDeleteConfirmLog(log)}
                                title="Delete Entry"
                              >
                                <FaTrash /> Delete
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
          </div>
        )}
      </main>
    </div>

      {/* Edit Entry Modal */}
      {editModalLog && (
        <div className="modal-overlay" onClick={() => setEditModalLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Activity Entry</h3>
            <form onSubmit={handleSaveEdit} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <input className="form-input" type="text" value={editModalLog.activityTypeName} disabled />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={editModalLog.quantity}
                    onChange={(e) => setEditModalLog({ ...editModalLog, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="form-input" type="text" value={editModalLog.unit} disabled />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Activity Date *</label>
                <input
                  className="form-input"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={editModalLog.activityDateIso || (editModalLog.activityDate ? editModalLog.activityDate.split('T')[0] : '')}
                  onChange={(e) => setEditModalLog({ ...editModalLog, activityDateIso: e.target.value, activityDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  className="form-input"
                  type="text"
                  value={editModalLog.notes || ''}
                  onChange={(e) => setEditModalLog({ ...editModalLog, notes: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">
                  Save Changes
                </button>
                <button type="button" className="btn-google" onClick={() => setEditModalLog(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CONFIRM DELETE ACTIVITY LOG MODAL ===== */}
      {deleteConfirmLog && (
        <div className="mat-modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.85)', position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mat-modal-card" style={{ width: '100%', maxWidth: '440px', background: '#1E293B', border: '1px solid #334155', borderRadius: '20px', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)' }}>
            <div className="mat-modal-icon icon-danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="12" y1="9" x2="12" y2="15" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ color: '#F8FAFC', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Delete Activity Log</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to permanently delete activity log entry for <strong>"{deleteConfirmLog.activityTypeName || 'Activity'}"</strong>?
              This action cannot be undone.
            </p>
            <div className="mat-modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmLog(null)}>
                Cancel
              </button>
              <button type="button" className="mat-btn-danger" onClick={handleConfirmDeleteLog}>
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRM LOGOUT MODAL ===== */}
      {showLogoutModal && (
        <div className="mat-modal-overlay" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10, 15, 26, 0.85)', position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="mat-modal-card" style={{ width: '100%', maxWidth: '440px', background: '#1E293B', border: '1px solid #334155', borderRadius: '20px', padding: '2rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)' }}>
            <div className="mat-modal-icon icon-danger" style={{ background: '#FFF3E0', borderColor: '#FFE0B2' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F57C00" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <h3 style={{ color: '#F8FAFC', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Confirm Logout</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              Are you sure you want to log out of your session?
            </p>
            <div className="mat-modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
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
            onClick={() => { setSuccess(''); setError(''); }}
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
