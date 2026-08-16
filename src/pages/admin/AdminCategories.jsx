import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';
import './AdminCategories.css';
import {
  FaCar,
  FaBolt,
  FaUtensils,
  FaShoppingBag,
  FaTrashAlt,
  FaTint,
  FaGasPump,
  FaLeaf,
  FaPlus,
  FaSearch,
  FaThLarge,
  FaList,
  FaEdit,
  FaPowerOff,
  FaHashtag,
  FaSpinner,
  FaBoxes
} from 'react-icons/fa';

// Realistic Category Photographs
import transportImg from '../../assets/Images/categories/transport.png';
import electricityImg from '../../assets/Images/categories/electricity.png';
import foodImg from '../../assets/Images/categories/food.png';
import shoppingImg from '../../assets/Images/categories/shopping.png';
import wasteImg from '../../assets/Images/categories/waste.png';
import waterImg from '../../assets/Images/categories/water.png';

const PAGE_SIZES = [10, 50, 100];
const STATUS_OPTIONS = ['All statuses', 'ACTIVE', 'INACTIVE'];

// Icon & Dynamic Theme Helper mapping realistic photographs for Transport, Electricity, Food, Shopping, Waste, Water
const getCategoryTheme = (cat) => {
  const name = (cat.name || '').toLowerCase();
  const icon = (cat.iconName || '').toLowerCase();

  if (name.includes('transport') || icon.includes('car') || icon.includes('vehicle')) {
    return {
      image: transportImg,
      icon: <FaCar />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      subtypes: ['Electric & Cars', 'Transit & Flights']
    };
  }
  if (name.includes('electr') || name.includes('power') || name.includes('energy') || icon.includes('bolt')) {
    return {
      image: electricityImg,
      icon: <FaBolt />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      subtypes: ['Grid Power (kWh)', 'Solar & Gas']
    };
  }
  if (name.includes('food') || name.includes('meal') || name.includes('diet') || icon.includes('utensil')) {
    return {
      image: foodImg,
      icon: <FaUtensils />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      subtypes: ['Meat & Poultry', 'Plant-Based']
    };
  }
  if (name.includes('shop') || name.includes('buy') || name.includes('retail') || icon.includes('bag')) {
    return {
      image: shoppingImg,
      icon: <FaShoppingBag />,
      color: cat.colorCode && cat.colorCode !== '#10B981' ? cat.colorCode : '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      subtypes: ['Apparel & Fashion', 'Electronics']
    };
  }
  if (name.includes('waste') || icon.includes('trash') || icon.includes('recycle')) {
    return {
      image: wasteImg,
      icon: <FaTrashAlt />,
      color: cat.colorCode || '#14B8A6',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
      subtypes: ['Landfill Waste', 'Recycling']
    };
  }
  if (name.includes('water') || icon.includes('tint')) {
    return {
      image: waterImg,
      icon: <FaTint />,
      color: cat.colorCode || '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      subtypes: ['Mains Supply', 'Hot Water']
    };
  }

  return {
    image: transportImg,
    icon: <FaLeaf />,
    color: cat.colorCode || '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    subtypes: ['General Activity']
  };
};

export default function AdminCategories({ token, onNavigateToTypes }) {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    categoryCode: '',
    name: '',
    description: '',
    iconName: 'folder',
    colorCode: '#10B981',
    displayOrder: 0,
    active: true,
    remarks: '',
  });

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getCategories(token, { page: currentPage, size: pageSize });
      setCategories(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      categoryCode: '',
      name: '',
      description: '',
      iconName: 'folder',
      colorCode: '#10B981',
      displayOrder: categories.length + 1,
      active: true,
      remarks: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditId(cat.id);
    setForm({
      categoryCode: cat.categoryCode || '',
      name: cat.name,
      description: cat.description || '',
      iconName: cat.iconName || 'folder',
      colorCode: cat.colorCode || '#10B981',
      displayOrder: cat.displayOrder || 0,
      active: cat.active,
      remarks: cat.remarks || '',
    });
    setShowModal(true);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await adminApi.updateCategory(token, editId, form);
        setSuccess(`Category '${form.name}' updated successfully`);
      } else {
        await adminApi.createCategory(token, form);
        setSuccess(`Category '${form.name}' created successfully`);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (cat) => {
    if (!window.confirm(`Deactivate category '${cat.name}'?`)) return;
    try {
      await adminApi.updateCategory(token, cat.id, {
        categoryCode: cat.categoryCode,
        name: cat.name,
        description: cat.description || '',
        iconName: cat.iconName || 'folder',
        colorCode: cat.colorCode || '#10B981',
        displayOrder: cat.displayOrder || 0,
        active: false,
        remarks: cat.remarks || '',
      });
      setSuccess(`Category '${cat.name}' deactivated`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category '${name}'? This will remove or deactivate this category, all its activity types, and emission factors.`)) {
      return false;
    }
    try {
      const res = await adminApi.deleteCategory(token, id);
      setSuccess(res.message || `Category '${name}' deleted`);
      setShowModal(false);
      fetchCategories();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleActivate = async (cat) => {
    if (!window.confirm(`Activate category '${cat.name}'?`)) return;
    try {
      await adminApi.updateCategory(token, cat.id, {
        categoryCode: cat.categoryCode,
        name: cat.name,
        description: cat.description || '',
        iconName: cat.iconName || 'folder',
        colorCode: cat.colorCode || '#10B981',
        displayOrder: cat.displayOrder || 0,
        active: true,
        remarks: cat.remarks || '',
      });
      setSuccess(`Category '${cat.name}' activated successfully`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    const matchesStatus =
      statusFilter === 'All statuses'
        ? true
        : statusFilter === 'ACTIVE'
        ? cat.active
        : !cat.active;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      cat.name?.toLowerCase().includes(query) ||
      cat.categoryCode?.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="admin-sub-tab">
      {/* Top Header */}
      <div className="admin-sub-header">
        <div>
          <h2 className="sub-title">Category Management</h2>
          <p className="sub-desc">
            Manage top-level activity classifications & emission categories (Transport, Electricity, Food, Shopping)
          </p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          <FaPlus /> Add Category
        </button>
      </div>

      {/* Toolbar & Controls */}
      <div className="categories-toolbar">
        <div className="toolbar-left">
          {/* Live Search */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search category, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Pills */}
          <div className="filter-pills">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                className={`filter-pill ${statusFilter === opt ? 'active' : ''}`}
                onClick={() => setStatusFilter(opt)}
              >
                {opt === 'All statuses' ? 'All' : opt === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          {/* Page Size Select */}
          <div className="admin-page-size" style={{ margin: 0 }}>
            <label htmlFor="cat-page-size" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Show
            </label>
            <select
              id="cat-page-size"
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

          {/* View Toggle Mode */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Cards Grid View"
            >
              <FaThLarge /> Cards
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <FaList /> Table
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT VIEW */}
      {loading ? (
        <div className="empty-categories-card">
          <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.5rem' }}>Loading activity categories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="empty-categories-card">
          <FaBoxes />
          <h3 style={{ color: '#F8FAFC', margin: '0.5rem 0' }}>No Categories Found</h3>
          <p>No activity categories match your current search or status criteria.</p>
          <button className="btn-add" style={{ marginTop: '1rem' }} onClick={handleOpenCreate}>
            <FaPlus /> Create First Category
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* COMPACT CARDS GRID VIEW WITH COMPACT PHOTOGRAPHY BANNERS */
        <div className="category-cards-grid">
          {filteredCategories.map((cat) => {
            const theme = getCategoryTheme(cat);
            const code = cat.categoryCode || cat.name?.substring(0, 3).toUpperCase();

            return (
              <div
                key={cat.id}
                className="category-card"
                style={{ cursor: onNavigateToTypes ? 'pointer' : 'default' }}
                onClick={() => onNavigateToTypes && onNavigateToTypes(cat)}
              >
                {/* Hero Compact Realistic Photography Banner */}
                <div className="category-card-hero-container">
                  <img
                    src={theme.image}
                    alt={cat.name}
                    className="category-card-hero-image"
                  />
                  <div className="category-card-hero-overlay">
                    <div
                      className="category-icon-wrapper"
                      style={{ background: theme.gradient }}
                    >
                      {theme.icon}
                    </div>
                    <div className="category-card-meta">
                      <span className={`status-tag ${cat.active ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="category-card-body">
                  <h3 className="category-title">{cat.name}</h3>
                  <p className="category-description">
                    {cat.description || 'No detailed description provided.'}
                  </p>

                  {/* Subtypes Preview Tags */}
                  <div className="category-subtypes-preview">
                    {theme.subtypes.map((sub, idx) => (
                      <span key={idx} className="subtype-tag">
                        • {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="category-card-footer" style={{ justifyContent: 'flex-end' }}>
                  <div className="card-actions">
                    <button
                      className="card-action-btn edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(cat);
                      }}
                      title="Edit Category"
                    >
                      <FaEdit /> Edit
                    </button>
                    {cat.active ? (
                      <button
                        className="card-action-btn deactivate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeactivate(cat);
                        }}
                        title="Deactivate Category"
                      >
                        <FaPowerOff /> Deactivate
                      </button>
                    ) : (
                      <button
                        className="card-action-btn activate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(cat);
                        }}
                        title="Activate Category"
                      >
                        <FaPowerOff /> Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="admin-table-card">
          <div className={`admin-table-wrapper ${pageSize >= 50 ? 'table-scroll-large' : ''}`}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Code</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Icon</th>
                  <th>Color</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.displayOrder}</td>
                    <td>
                      <span className="doc-badge">
                        {cat.categoryCode || cat.name?.substring(0, 3).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</td>
                    <td>{cat.description || '—'}</td>
                    <td>
                      <code>{cat.iconName}</code>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: cat.colorCode || '#10B981',
                            display: 'inline-block',
                          }}
                        ></span>
                        {cat.colorCode || '#10B981'}
                      </span>
                    </td>
                    <td>{cat.remarks || '—'}</td>
                    <td>
                      <span className={`status-badge ${cat.active ? 'status-approved' : 'status-rejected'}`}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn action-approve" onClick={() => handleOpenEdit(cat)}>
                        Edit
                      </button>
                      {cat.active ? (
                        <button
                          className="action-btn action-reject"
                          onClick={() => handleDeactivate(cat)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button className="action-btn action-approve" onClick={() => handleActivate(cat)}>
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{editId ? 'Edit Category' : 'Add New Category'}</h3>
            </div>
            <form onSubmit={handleSave} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Transport"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category Code</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.categoryCode}
                    onChange={(e) => setForm({ ...form, categoryCode: e.target.value })}
                    placeholder="TRA"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Vehicle emissions from commuting, flights, and public transit"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icon Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.iconName}
                    onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                    placeholder="car, bolt, utensils, shopping-bag"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color Accent</label>
                  <input
                    className="form-input"
                    type="color"
                    value={form.colorCode}
                    onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                    style={{ height: '42px', padding: '2px 4px' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={form.active ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Optional administrative notes"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
                <button type="submit" className="btn-submit">
                  Save Category
                </button>
                <button type="button" className="btn-google" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
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
