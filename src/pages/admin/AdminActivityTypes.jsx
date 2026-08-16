import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';
import { FaSearch, FaPlus, FaSpinner } from 'react-icons/fa';
import transportImg from '../../assets/Images/categories/transport.png';
import electricityImg from '../../assets/Images/categories/electricity.png';
import foodImg from '../../assets/Images/categories/food.png';
import shoppingImg from '../../assets/Images/categories/shopping.png';
import wasteImg from '../../assets/Images/categories/waste.png';
import waterImg from '../../assets/Images/categories/water.png';

const PAGE_SIZES = [10, 50, 100];
const STATUS_OPTIONS = ['All statuses', 'ACTIVE', 'INACTIVE'];

const getCategoryPillDetails = (catName) => {
  const name = (catName || '').toLowerCase();
  if (name.includes('transport') || name.includes('travel')) {
    return {
      image: transportImg,
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.15)',
      border: 'rgba(6, 182, 212, 0.3)',
      text: '#38BDF8'
    };
  }
  if (name.includes('electr') || name.includes('power') || name.includes('energy')) {
    return {
      image: electricityImg,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#FBBF24'
    };
  }
  if (name.includes('food') || name.includes('meal') || name.includes('diet')) {
    return {
      image: foodImg,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34D399'
    };
  }
  if (name.includes('shop') || name.includes('buy') || name.includes('retail')) {
    return {
      image: shoppingImg,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.15)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#A78BFA'
    };
  }
  if (name.includes('waste') || name.includes('trash')) {
    return {
      image: wasteImg,
      color: '#14B8A6',
      bg: 'rgba(20, 184, 166, 0.15)',
      border: 'rgba(20, 184, 166, 0.3)',
      text: '#2DD4BF'
    };
  }
  if (name.includes('water') || name.includes('tint')) {
    return {
      image: waterImg,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#60A5FA'
    };
  }

  return {
    image: transportImg,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#34D399'
  };
};

export default function AdminActivityTypes({ token, initialCategoryId = '' }) {
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState(initialCategoryId || '');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (initialCategoryId !== undefined && initialCategoryId !== null) {
      setSelectedCatFilter(initialCategoryId);
    }
  }, [initialCategoryId]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState(null);
  const [form, setForm] = useState({
    categoryId: '',
    activityCode: '',
    name: '',
    description: '',
    unit: 'km',
    minQuantity: 0.1,
    maxQuantity: 10000,
    defaultQuantity: 1,
    displayOrder: 0,
    icon: 'activity',
    active: true,
    remarks: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories(token, { page: 0, size: 100 });
      setCategories(res.content || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchTypes = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getActivityTypes(token, {
        categoryId: selectedCatFilter || undefined,
        page: currentPage,
        size: pageSize,
      });
      setTypes(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedCatFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      categoryId: categories[0]?.id || '',
      activityCode: '',
      name: '',
      description: '',
      unit: 'km',
      minQuantity: 0.1,
      maxQuantity: 10000,
      defaultQuantity: 1,
      displayOrder: types.length + 1,
      icon: 'activity',
      active: true,
      remarks: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditId(t.id);
    setForm({
      categoryId: t.categoryId,
      activityCode: t.activityCode || '',
      name: t.name,
      description: t.description || '',
      unit: t.unit,
      minQuantity: t.minQuantity ?? 0.1,
      maxQuantity: t.maxQuantity ?? 10000,
      defaultQuantity: t.defaultQuantity ?? 1,
      displayOrder: t.displayOrder || 0,
      icon: t.icon || 'activity',
      active: t.active,
      remarks: t.remarks || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.categoryId) {
      setError('Please select a valid Category');
      return;
    }
    if (!form.name || !form.name.trim()) {
      setError('Activity type name is required');
      return;
    }
    if (!form.unit || !form.unit.trim()) {
      setError('Unit is required');
      return;
    }

    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      name: form.name.trim(),
      unit: form.unit.trim(),
      minQuantity: form.minQuantity !== '' && form.minQuantity !== null && !isNaN(form.minQuantity) ? Number(form.minQuantity) : 0.1,
      maxQuantity: form.maxQuantity !== '' && form.maxQuantity !== null && !isNaN(form.maxQuantity) ? Number(form.maxQuantity) : 10000,
      defaultQuantity: form.defaultQuantity !== '' && form.defaultQuantity !== null && !isNaN(form.defaultQuantity) ? Number(form.defaultQuantity) : 1,
      displayOrder: form.displayOrder !== '' && form.displayOrder !== null && !isNaN(form.displayOrder) ? Number(form.displayOrder) : 0,
    };

    try {
      if (editId) {
        await adminApi.updateActivityType(token, editId, payload);
        setSuccess('Activity type updated successfully');
      } else {
        await adminApi.createActivityType(token, payload);
        setSuccess('Activity type created successfully');
      }
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      setError(err.message);
    }
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

  const handleDeactivate = async (t) => {
    if (!window.confirm(`Deactivate activity type '${t.name}'?`)) return;
    try {
      await adminApi.updateActivityType(token, t.id, {
        categoryId: t.categoryId,
        activityCode: t.activityCode,
        name: t.name,
        description: t.description || '',
        unit: t.unit,
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        defaultQuantity: t.defaultQuantity,
        displayOrder: t.displayOrder,
        icon: t.icon,
        active: false,
        remarks: t.remarks || '',
      });
      setSuccess(`Activity type '${t.name}' deactivated`);
      fetchTypes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmType) return;
    const typeToDelete = deleteConfirmType;
    setDeleteConfirmType(null);
    try {
      const res = await adminApi.deleteActivityType(token, typeToDelete.id);
      setSuccess(res.message || `Activity type '${typeToDelete.name}' permanently deleted`);
      fetchTypes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (t) => {
    if (!window.confirm(`Activate activity type '${t.name}'?`)) return;
    try {
      await adminApi.updateActivityType(token, t.id, {
        categoryId: t.categoryId,
        activityCode: t.activityCode,
        name: t.name,
        description: t.description || '',
        unit: t.unit,
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity,
        defaultQuantity: t.defaultQuantity,
        displayOrder: t.displayOrder,
        icon: t.icon,
        active: true,
        remarks: t.remarks || '',
      });
      setSuccess(`Activity type '${t.name}' activated successfully`);
      fetchTypes();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTypes = types.filter((t) => {
    const matchesStatus =
      statusFilter === 'All statuses'
        ? true
        : statusFilter === 'ACTIVE'
        ? t.active
        : !t.active;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.name?.toLowerCase().includes(query) ||
      t.activityCode?.toLowerCase().includes(query) ||
      t.categoryName?.toLowerCase().includes(query) ||
      t.unit?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.remarks?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="admin-sub-tab">
      <div className="admin-sub-header">
        <div>
          <h2 className="sub-title">Activity Type Management</h2>
          <p className="sub-desc">Define activity options within categories (Car, Bus, Bike, Grid Electricity, Veg Meal, etc.)</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          <FaPlus /> Add Activity Type
        </button>
      </div>

      {/* Toolbar with Search Box & Controls */}
      <div className="categories-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search activity type, code, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
          <div className="admin-page-size" style={{ margin: 0 }}>
            <label htmlFor="type-cat-filter" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Category Filter:
            </label>
            <select
              id="type-cat-filter"
              className="admin-select"
              value={selectedCatFilter}
              onChange={(e) => {
                setSelectedCatFilter(e.target.value);
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

          <div className="admin-page-size" style={{ margin: 0 }}>
            <label htmlFor="type-page-size" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Show
            </label>
            <select
              id="type-page-size"
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

      <div className="admin-table-card">
        <div className={`admin-table-wrapper ${pageSize >= 50 ? 'table-scroll-large' : ''}`}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Code</th>
                <th>Activity Type</th>
                <th>Unit</th>
                <th>Range</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="admin-table-empty">
                    <div className="admin-table-loader"><span className="spinner"></span> Loading activity types...</div>
                  </td>
                </tr>
              ) : filteredTypes.length === 0 ? (
                <tr><td colSpan="8" className="admin-table-empty">No activity types found matching criteria</td></tr>
              ) : (
                filteredTypes.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {(() => {
                        const pill = getCategoryPillDetails(t.categoryName);
                        return (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              padding: '0.2rem 0.6rem 0.2rem 0.3rem',
                              borderRadius: '20px',
                              background: pill.bg,
                              border: `1px solid ${pill.border}`,
                              color: pill.text,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            }}
                          >
                            <img
                              src={pill.image}
                              alt=""
                              aria-hidden="true"
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }}
                            />
                            {t.categoryName || 'GENERAL'}
                          </span>
                        );
                      })()}
                    </td>
                    <td><span className="doc-badge">{t.activityCode || t.name?.substring(0, 4).toUpperCase()}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</td>
                    <td><code>{t.unit}</code></td>
                    <td><code>{t.minQuantity ?? 0} – {t.maxQuantity ?? '∞'}</code></td>
                    <td>{t.remarks || '—'}</td>
                    <td>
                      <span className={`status-badge ${t.active ? 'status-approved' : 'status-rejected'}`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', width: '240px', minWidth: '240px' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        <button className="action-btn action-approve" style={{ margin: 0, minWidth: '55px', textAlign: 'center', justifyContent: 'center' }} onClick={() => handleOpenEdit(t)}>Edit</button>
                        {t.active ? (
                          <button className="action-btn action-reject" style={{ margin: 0, minWidth: '95px', textAlign: 'center', justifyContent: 'center' }} onClick={() => handleDeactivate(t)}>Deactivate</button>
                        ) : (
                          <button className="action-btn action-approve" style={{ margin: 0, minWidth: '95px', textAlign: 'center', justifyContent: 'center' }} onClick={() => handleActivate(t)}>Activate</button>
                        )}
                        <button className="action-btn action-reject" style={{ margin: 0, minWidth: '65px', textAlign: 'center', justifyContent: 'center', backgroundColor: '#EF4444', color: '#FFFFFF', borderColor: '#EF4444' }} onClick={() => setDeleteConfirmType(t)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="admin-pagination">
            <button className="pagination-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>«</button>
            <button className="pagination-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>‹</button>
            <span className="pagination-pages">Page {currentPage + 1} of {totalPages}</span>
            <button className="pagination-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}>›</button>
            <button className="pagination-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(totalPages - 1)}>»</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Activity Type' : 'Add Activity Type'}</h3>
            <form onSubmit={handleSave} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Activity Code</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.activityCode}
                    onChange={e => setForm({ ...form, activityCode: e.target.value })}
                    placeholder="CAR"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Activity Type Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Car"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="km, kWh, serving"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Quantity</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    value={form.minQuantity}
                    onChange={e => setForm({ ...form, minQuantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Quantity</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    value={form.maxQuantity}
                    onChange={e => setForm({ ...form, maxQuantity: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Qty</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    value={form.defaultQuantity}
                    onChange={e => setForm({ ...form, defaultQuantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about this activity type"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={form.active ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, active: e.target.value === 'true' })}
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
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Optional admin remarks"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">Save Activity Type</button>
                <button type="button" className="btn-google" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteConfirmType && (
        <div
          className="mat-modal-overlay"
          style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(10, 15, 26, 0.85)',
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setDeleteConfirmType(null)}
        >
          <div
            className="mat-modal-card"
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '20px',
              padding: '1.75rem',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
              color: '#F8FAFC',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#EF4444',
                fontSize: '1.5rem',
              }}
            >
              🗑️
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#F8FAFC', fontWeight: 700 }}>
              Delete Activity Type?
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete activity type <strong style={{ color: '#F8FAFC' }}>"{deleteConfirmType.name}"</strong>? This will remove this activity type and its configured emission factor.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmType(null)}
                style={{ background: '#334155', color: '#94A3B8', border: '1px solid #475569', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={handleConfirmDelete}
                style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Yes, Delete Activity Type
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
