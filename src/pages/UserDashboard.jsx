import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi, authApi, goalApi, analyticsApi, articleApi } from '../api';
import AnalyticsCharts from '../components/AnalyticsCharts';
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
  const VALID_TABS = ['log', 'analytics', 'goals', 'articles', 'history'];
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'log';

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

  // Milestone 3 States
  const [topActivities, setTopActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [dismissAlert, setDismissAlert] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    categoryId: '',
    targetLimitKgCo2: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });

  const [editingGoal, setEditingGoal] = useState(null);
  const [editGoalForm, setEditGoalForm] = useState({
    title: '',
    categoryId: '',
    targetLimitKgCo2: 100,
    startDate: '',
    endDate: '',
  });

  const handleOpenEditGoal = (goal) => {
    setEditingGoal(goal);
    setEditGoalForm({
      title: goal.title || '',
      categoryId: goal.categoryId ? String(goal.categoryId) : '',
      targetLimitKgCo2: goal.targetLimitKgCo2 || 100,
      startDate: goal.startDate || '',
      endDate: goal.endDate || '',
    });
  };

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

  // Summary Stats & All Logs for Charts
  const [allUserLogs, setAllUserLogs] = useState([]);
  const [userStats, setUserStats] = useState({
    totalEmission: 0,
    totalCount: 0,
  });

  const fetchSummaryStats = useCallback(async () => {
    if (!token) return;
    try {
      const allRes = await userApi.getActivityHistory(token, { page: 0, size: 1000 });
      const logs = allRes.content || [];
      setAllUserLogs(logs);
      const sum = logs.reduce((acc, item) => acc + (item.totalEmission || item.kgCo2e || 0), 0);
      setUserStats({
        totalEmission: sum,
        totalCount: allRes.totalElements || logs.length,
      });
    } catch {
      // ignore
    }
  }, [token]);

  // Current month dynamic calculations for Ribbon & Budget Widget
  const currentMonthLogs = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    return allUserLogs.filter((log) => {
      const dStr = log.activityDateIso || log.activityDate;
      if (!dStr) return false;
      let d = new Date(dStr);
      if (isNaN(d.getTime()) && typeof dStr === 'string') {
        const p = dStr.split('-');
        if (p.length === 3 && p[2].length >= 4) {
          d = new Date(`${p[2]}-${p[1]}-${p[0]}`);
        }
      }
      return !isNaN(d.getTime()) && d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
  }, [allUserLogs]);

  const currentMonthEmissions = useMemo(() => {
    const sum = currentMonthLogs.reduce((acc, l) => acc + Number(l.totalEmission || l.kgCo2e || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [currentMonthLogs]);

  const activeGoal = useMemo(() => {
    if (!goals || goals.length === 0) return null;
    return (
      goals.find((g) => g.status === 'ACTIVE' && (!g.categoryId || g.categoryCode === 'ALL')) ||
      goals.find((g) => g.status === 'ACTIVE') ||
      goals[0]
    );
  }, [goals]);

  // Unified numbers matching GoalService backend logic
  const targetLimit = activeGoal && activeGoal.targetLimitKgCo2 != null
    ? Number(activeGoal.targetLimitKgCo2)
    : 5.0;

  const currentEmission = activeGoal && activeGoal.currentEmissionKgCo2 != null
    ? Math.round(Number(activeGoal.currentEmissionKgCo2) * 10) / 10
    : currentMonthEmissions;

  const budgetPct = activeGoal && activeGoal.progressPercentage != null
    ? Math.round(Number(activeGoal.progressPercentage))
    : (targetLimit > 0 ? Math.round((currentEmission / targetLimit) * 100) : 0);

  const remainingBudget = Math.max(0, Math.round((targetLimit - currentEmission) * 10) / 10);

  const isExceeded = activeGoal?.status === 'EXCEEDED' || currentEmission > targetLimit || budgetPct > 100;
  const isWarning = !isExceeded && (budgetPct >= 90 || activeGoal?.statusMessage?.includes('Warning'));
  const goalStatusLabel = isExceeded ? 'Exceeded' : isWarning ? 'Warning' : 'On Track';
  const goalStatusColor = isExceeded ? '#F87171' : isWarning ? '#FBBF24' : '#34D399';
  const goalStatusBg = isExceeded ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  const goalIconGradient = isExceeded
    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    : isWarning
    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)';

  // Dynamic Eco Achievement & Milestone System (Database-Driven)
  const userTransportCount = useMemo(() => {
    return allUserLogs.filter((l) => (l.categoryName || '').toLowerCase().includes('transport')).length;
  }, [allUserLogs]);

  const userEnergyCount = useMemo(() => {
    return allUserLogs.filter(
      (l) => (l.categoryName || '').toLowerCase().includes('electr') || (l.categoryName || '').toLowerCase().includes('energy')
    ).length;
  }, [allUserLogs]);

  const badgesList = useMemo(() => {
    const totalCount = allUserLogs.length;
    const isTargetMaintained = budgetPct > 0 && budgetPct <= 100 && currentMonthLogs.length > 0;

    return [
      {
        id: 'first_step',
        icon: '🌱',
        name: 'First Steps',
        desc: 'Log your first carbon activity',
        unlocked: totalCount >= 1,
        current: Math.min(totalCount, 1),
        target: 1,
        unit: 'log',
        accentColor: '#10B981',
      },
      {
        id: 'target_keeper',
        icon: '🎯',
        name: 'Target Keeper',
        desc: 'Keep emissions below monthly budget',
        unlocked: isTargetMaintained,
        current: isTargetMaintained ? 1 : 0,
        target: 1,
        unit: isTargetMaintained ? 'Active' : 'Over Budget',
        accentColor: '#3B82F6',
      },
      {
        id: 'green_traveler',
        icon: '🚴',
        name: 'Green Traveler',
        desc: 'Log 5 transit / commute activities',
        unlocked: userTransportCount >= 5,
        current: Math.min(userTransportCount, 5),
        target: 5,
        unit: 'trips',
        accentColor: '#F59E0B',
      },
      {
        id: 'energy_guardian',
        icon: '⚡',
        name: 'Energy Guardian',
        desc: 'Log 5 home energy / electricity entries',
        unlocked: userEnergyCount >= 5,
        current: Math.min(userEnergyCount, 5),
        target: 5,
        unit: 'entries',
        accentColor: '#8B5CF6',
      },
      {
        id: 'eco_warrior',
        icon: '🛡️',
        name: 'Eco Warrior',
        desc: 'Log 15+ carbon footprint activities',
        unlocked: totalCount >= 15,
        current: Math.min(totalCount, 15),
        target: 15,
        unit: 'logs',
        accentColor: '#EC4899',
      },
      {
        id: 'carbon_champion',
        icon: '🏆',
        name: 'Climate Champion',
        desc: 'Log 30+ activities across all sectors',
        unlocked: totalCount >= 30,
        current: Math.min(totalCount, 30),
        target: 30,
        unit: 'logs',
        accentColor: '#06B6D4',
      },
    ];
  }, [allUserLogs, budgetPct, currentMonthLogs, userTransportCount, userEnergyCount]);

  const unlockedCount = useMemo(() => badgesList.filter((b) => b.unlocked).length, [badgesList]);

  const userLevel = useMemo(() => {
    if (unlockedCount >= 6) return { title: 'Carbon Neutral Champion 🏆', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' };
    if (unlockedCount >= 4) return { title: 'Sustainability Advocate 🌍', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' };
    if (unlockedCount >= 2) return { title: 'Climate Conscious 🌿', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    return { title: 'Eco Starter 🌱', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' };
  }, [unlockedCount]);

  // CSV Exporter for History logs
  const handleExportCsv = () => {
    if (!allUserLogs || allUserLogs.length === 0) return;
    const headers = ['ID', 'Date', 'Category', 'Activity Type', 'Quantity', 'Unit', 'Factor (kg CO2e/unit)', 'Total Emission (kg CO2e)', 'Notes'];
    const rows = allUserLogs.map((l) => [
      l.id,
      l.activityDateIso || l.activityDate || '',
      `"${(l.categoryName || '').replace(/"/g, '""')}"`,
      `"${(l.activityTypeName || '').replace(/"/g, '""')}"`,
      l.quantity || 0,
      `"${l.unit || ''}"`,
      l.emissionFactor || 0,
      l.totalEmission || 0,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `carbon_footprint_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch Activity History
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const targetCatId = historyCategoryFilter || categoryIdParam || undefined;
      const res = await userApi.getActivityHistory(token, {
        date: historyDateFilter || undefined,
        categoryId: targetCatId,
        page: currentPage,
        size: pageSize,
      });
      setHistoryLogs(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, historyDateFilter, historyCategoryFilter, categoryIdParam, currentPage, pageSize]);

  // Milestone 3 Fetchers
  const fetchAnalytics = useCallback(async () => {
    if (!token) return;
    try {
      const [topRes, alertRes] = await Promise.all([
        analyticsApi.getTopActivities(token),
        analyticsApi.getAlerts(token)
      ]);
      setTopActivities(topRes || []);
      setAlerts(alertRes || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, [token]);

  const fetchGoals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await goalApi.getUserGoals(token);
      setGoals(res || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
    }
  }, [token]);

  const fetchArticles = useCallback(async () => {
    try {
      let targetCategoryFilter = undefined;
      if (categoryIdParam && categories.length > 0) {
        const matched = categories.find((c) => String(c.id) === String(categoryIdParam));
        if (matched) targetCategoryFilter = matched.name;
      }
      const res = await articleApi.getPublishedArticles(targetCategoryFilter);
      setArticles(res.content || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
    }
  }, [categoryIdParam, categories]);

  // Initial mount load
  useEffect(() => {
    fetchCategories();
    fetchSummaryStats();
    fetchGoals();
  }, [fetchCategories, fetchSummaryStats, fetchGoals]);

  // Tab & Filter load: synchronize stats, logs, and goals on every tab navigation
  useEffect(() => {
    fetchSummaryStats();
    fetchGoals();
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
    if (activeTab === 'articles') fetchArticles();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchAnalytics, fetchGoals, fetchArticles, fetchHistory, fetchSummaryStats]);

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

          {/* CRITICAL TARGET EXCEEDED ALERT BANNER */}
          {!dismissAlert &&
            (goals.some((g) => g.status === 'EXCEEDED' || (g.progressPercentage && g.progressPercentage >= 100)) ||
              alerts.some((a) => a.alertLevel === 'CRITICAL')) && (
              <div
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  margin: '1.25rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  gap: '1.25rem',
                  boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                  <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>🚨</span>
                  <div>
                    <h4 style={{ margin: 0, color: '#F87171', fontSize: '1.15rem', fontWeight: 800 }}>
                      CRITICAL CARBON TARGET EXCEEDED!
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#FEE2E2', fontSize: '0.875rem', lineHeight: '1.4' }}>
                      One or more of your monthly carbon emission limits have been exceeded. Review your target limits and consider taking eco-friendly actions like public transport or energy reduction.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <button
                    className="btn-submit"
                    onClick={() => handleTabChange('goals')}
                    style={{
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      color: '#FFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Manage Goals & Targets
                  </button>
                  <button
                    onClick={() => setDismissAlert(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#F87171',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Dismiss Alert"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

        {/* Top Carbon Metric Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Card 1: Month Footprint */}
          <div
            style={{
              background: '#1E293B',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: '1.4rem',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              🌿
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                This Month's Emissions
              </span>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, marginTop: '2px' }}>
                {currentMonthEmissions} <small style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94A3B8' }}>kg CO₂e</small>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                ● {currentMonthLogs.length} active logs recorded
              </span>
            </div>
          </div>

          {/* Card 2: Active Monthly Target */}
          <div
            style={{
              background: '#1E293B',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              cursor: 'pointer',
            }}
            onClick={() => handleTabChange('goals')}
            title="Click to view and adjust monthly goals"
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: goalIconGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: '1.4rem',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              }}
            >
              🎯
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Limit ({targetLimit} kg)
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    background: goalStatusBg,
                    color: goalStatusColor,
                  }}
                >
                  {goalStatusLabel}
                </span>
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2, marginTop: '2px' }}>
                {budgetPct}% <small style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94A3B8' }}>consumed</small>
              </div>
              {/* Mini Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, budgetPct)}%`,
                    height: '100%',
                    background: isExceeded ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Remaining Allowance */}
          <div
            style={{
              background: '#1E293B',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: '1.4rem',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              }}
            >
              ⚡
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.76rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Remaining Allowance
              </span>
              <div
                style={{
                  fontSize: '1.55rem',
                  fontWeight: 800,
                  color: budgetPct > 100 ? '#F87171' : '#F8FAFC',
                  lineHeight: 1.2,
                  marginTop: '2px',
                }}
              >
                {budgetPct > 100 ? `+${(currentMonthEmissions - targetLimit).toFixed(1)} kg over` : `${remainingBudget} kg CO₂e`}
              </div>
              <span style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>
                {budgetPct > 100 ? 'Switch to eco transit to rebalance' : 'Available for remaining days'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="portal-tab-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            className={`portal-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => handleTabChange('log')}
          >
            <FaCalculator /> Log Daily Activity
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            <FaChartLine /> Top 5 Emissions & Alerts
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => handleTabChange('goals')}
          >
            <FaSeedling /> Carbon Goals & Targets
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => handleTabChange('articles')}
          >
            <FaBoxes /> Sustainability Articles Hub
          </button>
          <button
            className={`portal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            <FaHistory /> Activity History
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

              <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                  title="Export all activities to CSV report"
                >
                  📥 Export CSV
                </button>

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

        {/* TAB: TOP 5 EMISSIONS & ALERTS (RECOMMENDATIONS & ALERTS MODULE) */}
        {activeTab === 'analytics' && (
          <div className="portal-log-container">
            <div className="admin-sub-header">
              <div>
                <h2 className="sub-title">Top Emissions & Smart Recommendations</h2>
                <p className="sub-desc">Analyze your top carbon activity drivers and view threshold recommendations</p>
              </div>
            </div>

            {/* Visual Interactive Dashboard Charts */}
            <AnalyticsCharts topActivities={topActivities} historyLogs={allUserLogs.length > 0 ? allUserLogs : historyLogs} goals={goals} />

            {/* Smart Eco Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {alerts.map((alert, aIdx) => {
                const isCritical = alert.alertLevel === 'CRITICAL';
                const isWarning = alert.alertLevel === 'WARNING';
                return (
                  <div
                    key={aIdx}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderRadius: '16px',
                      background: isCritical
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.25) 100%)'
                        : isWarning
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.25) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
                      border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{isCritical ? '🚨' : isWarning ? '⚠️' : '🌱'}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: isCritical ? '#F87171' : isWarning ? '#FBBF24' : '#34D399' }}>
                        {alert.title}
                      </h4>
                      <p style={{ margin: '0.3rem 0', color: '#E2E8F0', fontSize: '0.9rem' }}>{alert.message}</p>
                      <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, marginTop: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.85rem', borderRadius: '8px' }}>
                        💡 <strong>Recommendation:</strong> {alert.recommendation}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top 5 Emissions Cards */}
            <h3 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '1rem' }}>🔥 Top 5 Highest Carbon Contributors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {topActivities.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: '1rem' }}>No activity data available to compute top emissions yet.</div>
              ) : (
                topActivities.map((act, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="doc-badge" style={{ backgroundColor: act.colorCode || '#10B981', color: '#fff' }}>
                        Rank {idx + 1} • {act.categoryName}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: '#34D399' }}>{act.percentageShare}%</strong>
                    </div>
                    <h4 style={{ margin: '0.5rem 0 0 0', color: '#FFF', fontSize: '1.1rem' }}>{act.activityTypeName}</h4>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F1F5F9' }}>
                      {act.totalEmissionKgCo2} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>kg CO₂e</span>
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Eco Achievements & Milestones */}
            <div style={{ marginTop: '2.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#FFF', margin: 0, fontWeight: 800 }}>
                      🏆 Eco Achievements &amp; Milestones
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#94A3B8',
                        background: '#0F172A',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontWeight: 600,
                      }}
                    >
                      {unlockedCount} of {badgesList.length} Earned
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#94A3B8', fontSize: '0.8rem' }}>
                    Real-time sustainability milestones calculated strictly from your logged activities and carbon budget
                  </p>
                </div>

                {/* Dynamic User Level Badge */}
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: userLevel.color,
                    background: userLevel.bg,
                    padding: '0.35rem 0.85rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    border: `1px solid ${userLevel.color}40`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  Rank Level: {userLevel.title}
                </span>
              </div>

              {/* Milestone Overall Progress Bar */}
              <div
                style={{
                  background: '#0F172A',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 600 }}>
                  Achievement Journey Progress:
                </div>
                <div
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    height: '8px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((unlockedCount / badgesList.length) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 800 }}>
                  {Math.round((unlockedCount / badgesList.length) * 100)}% Complete
                </div>
              </div>

              {/* Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.1rem' }}>
                {badgesList.map((badge) => {
                  const pct = Math.min(100, Math.round((badge.current / badge.target) * 100));
                  return (
                    <div
                      key={badge.id}
                      style={{
                        background: badge.unlocked ? '#1E293B' : 'rgba(30, 41, 59, 0.45)',
                        border: badge.unlocked
                          ? `1px solid ${badge.accentColor}50`
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '18px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: badge.unlocked ? `0 8px 24px rgba(0, 0, 0, 0.25)` : 'none',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span
                            style={{
                              fontSize: '1.75rem',
                              filter: badge.unlocked ? 'none' : 'grayscale(0.8)',
                              opacity: badge.unlocked ? 1 : 0.6,
                            }}
                          >
                            {badge.icon}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              background: badge.unlocked ? `${badge.accentColor}20` : 'rgba(255, 255, 255, 0.06)',
                              color: badge.unlocked ? badge.accentColor : '#64748B',
                              border: badge.unlocked ? `1px solid ${badge.accentColor}40` : '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {badge.unlocked ? '✓ Unlocked' : `🔒 In Progress`}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 0.3rem 0', color: badge.unlocked ? '#FFF' : '#CBD5E1', fontSize: '1rem', fontWeight: 700 }}>
                          {badge.name}
                        </h4>
                        <p style={{ margin: '0 0 0.75rem 0', color: '#94A3B8', fontSize: '0.76rem', lineHeight: 1.35 }}>
                          {badge.desc}
                        </p>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                            {badge.unlocked
                              ? 'Goal Achieved'
                              : `${badge.current} / ${badge.target} ${badge.unit}`}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: badge.unlocked ? badge.accentColor : '#94A3B8', fontWeight: 700 }}>
                            {pct}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: badge.unlocked ? badge.accentColor : '#64748B',
                              borderRadius: '3px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: GOALS & TARGETS (GOALS MODULE) */}
        {activeTab === 'goals' && (
          <div className="portal-log-container">
            <div className="admin-sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="sub-title">Monthly Carbon Targets & Goals</h2>
                <p className="sub-desc">Set emission limits and monitor real-time target progress</p>
              </div>
              <button
                className="btn-submit"
                onClick={() => setShowGoalModal(true)}
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
              >
                + Set New Monthly Goal
              </button>
            </div>

            {/* Goals Cards List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {goals.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: '2rem', background: '#1E293B', borderRadius: '16px', gridColumn: '1/-1' }}>
                  No active goals set yet. Click <strong>"+ Set New Monthly Goal"</strong> to create your first carbon target!
                </div>
              ) : (
                goals.map((g) => {
                  const pct = Math.min(g.progressPercentage || 0, 100);
                  const isExceeded = g.status === 'EXCEEDED' || (g.progressPercentage > 100);
                  const isWarn = g.progressPercentage >= 80 && !isExceeded;
                  const barColor = isExceeded ? '#EF4444' : isWarn ? '#F59E0B' : '#10B981';

                  return (
                    <div
                      key={g.id}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '16px',
                        background: '#1E293B',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#FFF', fontSize: '1.15rem' }}>{g.title}</h4>
                          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{g.categoryName}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleOpenEditGoal(g)}
                            style={{ border: 'none', background: 'transparent', color: '#60A5FA', cursor: 'pointer', fontSize: '1rem' }}
                            title="Edit Goal"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this carbon target?')) {
                                goalApi.deleteGoal(token, g.id).then(() => {
                                  setSuccess('Goal removed');
                                  fetchGoals();
                                });
                              }
                            }}
                            style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}
                            title="Delete Goal"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: barColor }}>
                          {g.currentEmissionKgCo2} <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>/ {g.targetLimitKgCo2} kg</span>
                        </span>
                        <span style={{ fontWeight: 700, color: barColor }}>{g.progressPercentage}%</span>
                      </div>

                      {/* Visual Progress Bar */}
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.4s ease' }} />
                      </div>

                      <div style={{ fontSize: '0.8rem', color: isExceeded ? '#F87171' : '#94A3B8', fontWeight: 600 }}>
                        {g.statusMessage || 'Target active'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB: SUSTAINABILITY ARTICLES HUB */}
        {activeTab === 'articles' && (
          <div className="portal-log-container">
            <div className="admin-sub-header">
              <div>
                <h2 className="sub-title">Sustainability & Environment Articles Hub</h2>
                <p className="sub-desc">Read climate insights, eco tips, and green living advice</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              {articles.length === 0 ? (
                <div style={{ color: '#94A3B8', padding: '2rem', background: '#1E293B', borderRadius: '16px', gridColumn: '1/-1' }}>
                  No published articles available at the moment. Check back soon!
                </div>
              ) : (
                articles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '16px',
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <span className="doc-badge" style={{ backgroundColor: '#10B981', color: '#fff', alignSelf: 'flex-start' }}>
                      {art.category || 'Sustainability'}
                    </span>
                    <h4 style={{ margin: 0, color: '#FFF', fontSize: '1.2rem', lineHeight: '1.3' }}>{art.title}</h4>
                    <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {art.summary}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: '#34D399', marginTop: 'auto', fontWeight: 600 }}>
                      Read Full Article →
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
            <span className="doc-badge" style={{ backgroundColor: '#10B981', color: '#fff', marginBottom: '0.5rem', display: 'inline-block' }}>
              {selectedArticle.category}
            </span>
            <h2 className="modal-title" style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{selectedArticle.title}</h2>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1rem' }}>
              By {selectedArticle.author || 'Admin Team'} • {selectedArticle.createdAt ? selectedArticle.createdAt.split(' ')[0] : ''}
            </div>

            <div style={{ color: '#E2E8F0', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-line', margin: '1rem 0' }}>
              {selectedArticle.content}
            </div>

            <button className="btn-google" onClick={() => setSelectedArticle(null)} style={{ marginTop: '1rem', width: '100%' }}>
              Close Article
            </button>
          </div>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Set Monthly Carbon Goal</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    title: goalForm.title || undefined,
                    categoryId: goalForm.categoryId ? Number(goalForm.categoryId) : undefined,
                    targetLimitKgCo2: Number(goalForm.targetLimitKgCo2),
                    startDate: goalForm.startDate,
                    endDate: goalForm.endDate,
                  };
                  await goalApi.createGoal(token, payload);
                  setSuccess('Goal set successfully!');
                  setShowGoalModal(false);
                  fetchGoals();
                  fetchAnalytics();
                } catch (err) {
                  setError(err.message);
                }
              }}
              className="auth-form"
              style={{ marginTop: '1rem' }}
            >
              <div className="form-group">
                <label className="form-label">Goal Title (Optional)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Monthly Transport Budget"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category (Optional - Leave blank for Overall)</label>
                <select
                  className="form-input"
                  value={goalForm.categoryId}
                  onChange={(e) => setGoalForm({ ...goalForm, categoryId: e.target.value })}
                >
                  <option value="">All Categories (Overall Target)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Limit (kg CO₂e) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  min="1"
                  value={goalForm.targetLimitKgCo2}
                  onChange={(e) => setGoalForm({ ...goalForm, targetLimitKgCo2: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={goalForm.startDate}
                    onChange={(e) => setGoalForm({ ...goalForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={goalForm.endDate}
                    onChange={(e) => setGoalForm({ ...goalForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">
                  Save Goal
                </button>
                <button type="button" className="btn-google" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {editingGoal && (
        <div className="modal-overlay" onClick={() => setEditingGoal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Monthly Carbon Target</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload = {
                    title: editGoalForm.title || undefined,
                    categoryId: editGoalForm.categoryId ? Number(editGoalForm.categoryId) : undefined,
                    targetLimitKgCo2: Number(editGoalForm.targetLimitKgCo2),
                    startDate: editGoalForm.startDate,
                    endDate: editGoalForm.endDate,
                  };
                  await goalApi.updateGoal(token, editingGoal.id, payload);
                  setSuccess('Goal updated successfully!');
                  setEditingGoal(null);
                  fetchGoals();
                  fetchAnalytics();
                } catch (err) {
                  setError(err.message);
                }
              }}
              className="auth-form"
              style={{ marginTop: '1rem' }}
            >
              <div className="form-group">
                <label className="form-label">Goal Title</label>
                <input
                  className="form-input"
                  type="text"
                  value={editGoalForm.title}
                  onChange={(e) => setEditGoalForm({ ...editGoalForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={editGoalForm.categoryId}
                  onChange={(e) => setEditGoalForm({ ...editGoalForm, categoryId: e.target.value })}
                >
                  <option value="">All Categories (Overall Target)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Limit (kg CO₂e) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.1"
                  min="1"
                  value={editGoalForm.targetLimitKgCo2}
                  onChange={(e) => setEditGoalForm({ ...editGoalForm, targetLimitKgCo2: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editGoalForm.startDate}
                    onChange={(e) => setEditGoalForm({ ...editGoalForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    value={editGoalForm.endDate}
                    onChange={(e) => setEditGoalForm({ ...editGoalForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">
                  Update Goal
                </button>
                <button type="button" className="btn-google" onClick={() => setEditingGoal(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
