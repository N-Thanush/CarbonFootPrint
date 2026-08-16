import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api';
import './AdminCategories.css';
import {
  FaCar,
  FaBolt,
  FaUtensils,
  FaShoppingBag,
  FaTrashAlt,
  FaTint,
  FaLeaf,
  FaSearch,
  FaPlus,
  FaBoxes,
  FaUndo,
  FaTimes,
  FaArrowLeft,
  FaHashtag
} from 'react-icons/fa';

import transportImg from '../../assets/Images/categories/transport.png';
import electricityImg from '../../assets/Images/categories/electricity.png';
import foodImg from '../../assets/Images/categories/food.png';
import shoppingImg from '../../assets/Images/categories/shopping.png';
import wasteImg from '../../assets/Images/categories/waste.png';
import waterImg from '../../assets/Images/categories/water.png';

const PAGE_SIZES = [10, 50, 100];
const STATUS_OPTIONS = ['All statuses', 'ACTIVE', 'INACTIVE'];

const getCategoryTheme = (cat) => {
  const name = (cat?.name || '').toLowerCase();
  const icon = (cat?.iconName || '').toLowerCase();

  if (name.includes('transport') || icon.includes('car') || icon.includes('vehicle')) {
    return {
      image: transportImg,
      icon: <FaCar />,
      color: cat?.colorCode && cat?.colorCode !== '#10B981' ? cat.colorCode : '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      subtypes: ['Electric & Fuel Vehicles', 'Flights & Transit']
    };
  }
  if (name.includes('electr') || name.includes('power') || name.includes('energy') || icon.includes('bolt')) {
    return {
      image: electricityImg,
      icon: <FaBolt />,
      color: cat?.colorCode && cat?.colorCode !== '#10B981' ? cat.colorCode : '#F59E0B',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      subtypes: ['Grid Electricity (kWh)', 'Solar & Gas']
    };
  }
  if (name.includes('food') || name.includes('meal') || name.includes('diet') || icon.includes('utensil')) {
    return {
      image: foodImg,
      icon: <FaUtensils />,
      color: cat?.colorCode && cat?.colorCode !== '#10B981' ? cat.colorCode : '#10B981',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      subtypes: ['Meat & Dairy', 'Plant-Based Meals']
    };
  }
  if (name.includes('shop') || name.includes('buy') || name.includes('retail') || icon.includes('bag')) {
    return {
      image: shoppingImg,
      icon: <FaShoppingBag />,
      color: cat?.colorCode && cat?.colorCode !== '#10B981' ? cat.colorCode : '#8B5CF6',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      subtypes: ['Apparel & Goods', 'Electronics']
    };
  }
  if (name.includes('waste') || icon.includes('trash') || icon.includes('recycle')) {
    return {
      image: wasteImg,
      icon: <FaTrashAlt />,
      color: cat?.colorCode || '#14B8A6',
      gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
      subtypes: ['Landfill Waste', 'Recycling']
    };
  }
  if (name.includes('water') || icon.includes('tint')) {
    return {
      image: waterImg,
      icon: <FaTint />,
      color: cat?.colorCode || '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      subtypes: ['Water Supply', 'Wastewater']
    };
  }

  return {
    image: transportImg,
    icon: <FaLeaf />,
    color: cat?.colorCode || '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
    subtypes: ['Emission Conversion']
  };
};

export default function AdminEmissionFactors({ token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCatCard = searchParams.get('category') || '';

  const [factors, setFactors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    activityTypeId: '',
    kgCo2PerUnit: 0.21,
    unit: 'km',
    source: 'EPA',
    sourceVersion: 'v2024',
    effectiveFrom: '',
    effectiveTo: '',
    active: true,
    remarks: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminApi.getCategories(token, { page: 0, size: 100 });
      setCategories(res.content || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [token]);

  const fetchActivityTypes = useCallback(async () => {
    try {
      const res = await adminApi.getActivityTypes(token, { page: 0, size: 100 });
      setActivityTypes(res.content || []);
    } catch (err) {
      console.error('Error fetching activity types:', err);
    }
  }, [token]);

  const fetchFactors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getEmissionFactors(token, {
        categoryId: selectedCatCard || undefined,
        activityTypeId: selectedTypeFilter || undefined,
        page: currentPage,
        size: pageSize,
      });
      setFactors(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedCatCard, selectedTypeFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
    fetchActivityTypes();
  }, [fetchCategories, fetchActivityTypes]);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const handleOpenEdit = (ef) => {
    setEditId(ef.id);
    setForm({
      activityTypeId: ef.activityTypeId,
      kgCo2PerUnit: ef.kgCo2PerUnit,
      unit: ef.unit || '',
      source: ef.source || '',
      sourceVersion: ef.sourceVersion || 'v1.0',
      effectiveFrom: ef.effectiveFrom || '',
      effectiveTo: ef.effectiveTo || '',
      active: ef.active,
      remarks: ef.remarks || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await adminApi.updateEmissionFactor(token, editId, form);
        setSuccess('Emission factor updated successfully');
      } else {
        await adminApi.createEmissionFactor(token, form);
        setSuccess('Emission factor created successfully');
      }
      setShowModal(false);
      fetchFactors();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (ef) => {
    if (!window.confirm(`Are you sure you want to permanently delete emission factor #${ef.id} (${ef.activityTypeName || 'Activity'})?`)) return;
    try {
      await adminApi.deleteEmissionFactor(token, ef.id);
      setSuccess(`Emission factor #${ef.id} deleted successfully.`);
      fetchFactors();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (ef) => {
    if (!window.confirm(`Activate emission factor #${ef.id}?`)) return;
    try {
      await adminApi.updateEmissionFactor(token, ef.id, {
        activityTypeId: ef.activityTypeId,
        kgCo2PerUnit: ef.kgCo2PerUnit,
        unit: ef.unit,
        source: ef.source || '',
        sourceVersion: ef.sourceVersion || 'v1.0',
        effectiveFrom: ef.effectiveFrom || null,
        effectiveTo: ef.effectiveTo || null,
        active: true,
        remarks: ef.remarks || '',
      });
      setSuccess(`Emission factor #${ef.id} activated successfully`);
      fetchFactors();
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(selectedCatCard));

  const filteredFactors = factors.filter((ef) => {
    const matchesStatus =
      statusFilter === 'All statuses'
        ? true
        : statusFilter === 'ACTIVE'
        ? ef.active
        : !ef.active;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ef.activityTypeName?.toLowerCase().includes(query) ||
      ef.categoryName?.toLowerCase().includes(query) ||
      ef.source?.toLowerCase().includes(query) ||
      ef.unit?.toLowerCase().includes(query) ||
      ef.remarks?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="admin-sub-tab">
      <div className="admin-sub-header">
        <div>
          <h2 className="sub-title">Emission Factor Management</h2>
          <p className="sub-desc">
            Configure CO₂ emission conversion rates per activity unit (Formula: Carbon Emission = Quantity × Emission Factor)
          </p>
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION CARDS GRID (Displayed when no card is selected) */}
      {!selectedCatCard ? (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ color: '#F8FAFC', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Select a Category to View Emission Factors
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0 }}>
              Click any category card below to open and manage its emission factors.
            </p>
          </div>

          <div className="category-cards-grid" style={{ marginBottom: '1.75rem' }}>
            {/* Individual Category Cards */}
            {categories.map((cat) => {
              const theme = getCategoryTheme(cat);
              const isInactive = cat.active === false;

              return (
                <div
                  key={cat.id}
                  className={`category-card ${isInactive ? 'inactive-card' : ''}`}
                  onClick={() => {
                    if (isInactive) return;
                    setSearchParams({ tab: 'emissionFactors', category: String(cat.id) });
                    setSelectedTypeFilter('');
                    setCurrentPage(0);
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
                  <div className="category-card-hero-container">
                    <img
                      src={theme.image}
                      alt=""
                      aria-hidden="true"
                      className="category-card-hero-image"
                      style={{ filter: isInactive ? 'grayscale(1)' : 'none' }}
                    />
                    <div className="category-card-hero-overlay">
                      <div className="category-icon-wrapper" style={{ background: isInactive ? '#334155' : theme.gradient }}>
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

                  <div className="category-card-body">
                    <h3 className="category-title" style={{ color: isInactive ? '#94A3B8' : '#F8FAFC' }}>
                      {cat.name}
                    </h3>
                    <p className="category-description" style={{ color: isInactive ? '#64748B' : undefined }}>
                      {isInactive ? 'This category is currently inactive and disabled.' : cat.description || 'Activity conversion factors'}
                    </p>
                    <div className="category-subtypes-preview">
                      {theme.subtypes.map((sub, idx) => (
                        <span
                          key={idx}
                          className="subtype-tag"
                          style={isInactive ? { background: '#1E293B', color: '#64748B', borderColor: '#334155' } : {}}
                        >
                          • {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STEP 2: SELECTED CATEGORY EMISSION FACTORS TABLE VIEW WITH BACK (←) BUTTON */
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {selectedCategoryObj ? (
                <>
                  <img
                    src={getCategoryTheme(selectedCategoryObj).image}
                    alt={selectedCategoryObj.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #10B981' }}
                  />
                  <div>
                    <h3 style={{ color: '#F8FAFC', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                      {selectedCategoryObj.name} Emission Factors
                    </h3>
                    <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                      {selectedCategoryObj.description || 'Showing active conversion factors for this category'}
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <h3 style={{ color: '#F8FAFC', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Category Emission Factors
                  </h3>
                  <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                    Showing factors for selected category
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSearchParams({ tab: 'emissionFactors' });
                setSelectedTypeFilter('');
                setCurrentPage(0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Back to Category Selection"
            >
              <FaArrowLeft />
            </button>
          </div>

          {/* Toolbar with Search Box & Show Size */}
          <div className="categories-toolbar">
            <div className="toolbar-left">
              <div className="search-box" style={{ maxWidth: '420px', width: '100%' }}>
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search emission factors by activity, code, unit, or source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="toolbar-right">
              <div className="admin-page-size" style={{ margin: 0 }}>
                <label htmlFor="factor-page-size" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Show
                </label>
                <select
                  id="factor-page-size"
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
                    <th>Activity Type</th>
                    <th>kg CO₂ / Unit</th>
                    <th>Source & Version</th>
                    <th>Effective Period</th>
                    <th>Remarks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="admin-table-empty">
                        <div className="admin-table-loader"><span className="spinner"></span> Loading emission factors...</div>
                      </td>
                    </tr>
                  ) : filteredFactors.length === 0 ? (
                    <tr><td colSpan="8" className="admin-table-empty">No emission factors found matching criteria</td></tr>
                  ) : (
                    filteredFactors.map((ef) => (
                      <tr key={ef.id}>
                        <td>
                          {(() => {
                            const theme = getCategoryTheme({ name: ef.categoryName });
                            return (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  padding: '0.2rem 0.6rem 0.2rem 0.3rem',
                                  borderRadius: '20px',
                                  background: `${theme.color}20`,
                                  border: `1px solid ${theme.color}50`,
                                  color: theme.color,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.02em',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                }}
                              >
                                <img
                                  src={theme.image}
                                  alt={ef.categoryName}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  }}
                                />
                                {ef.categoryName || 'GENERAL'}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ef.activityTypeName}</td>
                        <td style={{ color: 'var(--green-400)', fontWeight: 700 }}>{ef.kgCo2PerUnit} kg / {ef.unit}</td>
                        <td>{ef.source ? `${ef.source} (${ef.sourceVersion || 'v1.0'})` : '—'}</td>
                        <td>{ef.effectiveFrom ? `${ef.effectiveFrom} to ${ef.effectiveTo || 'Present'}` : 'All time'}</td>
                        <td>{ef.remarks || '—'}</td>
                        <td>
                          <span className={`status-badge ${ef.active ? 'status-approved' : 'status-rejected'}`}>
                            {ef.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                            <button className="action-btn action-approve" onClick={() => handleOpenEdit(ef)}>Edit</button>
                            {ef.active ? (
                              <button className="action-btn action-reject" onClick={() => handleDelete(ef)}>Deactivate</button>
                            ) : (
                              <button className="action-btn action-approve" onClick={() => handleActivate(ef)}>Activate</button>
                            )}
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
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Emission Factor' : 'Add Emission Factor'}</h3>
            <form onSubmit={handleSave} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Type *</label>
                <select
                  className="form-select"
                  value={form.activityTypeId}
                  onChange={e => {
                    const selId = e.target.value;
                    const selectedType = activityTypes.find(t => String(t.id) === String(selId));
                    setForm({ ...form, activityTypeId: selId, unit: selectedType ? selectedType.unit : form.unit });
                  }}
                  required
                >
                  <option value="">Select activity type</option>
                  {activityTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.categoryName} - per {t.unit})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">kg CO₂ per Unit *</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.001"
                    value={form.kgCo2PerUnit}
                    onChange={e => setForm({ ...form, kgCo2PerUnit: Number(e.target.value) })}
                    placeholder="0.21"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    placeholder="km, kWh, kg"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Data Source (IPCC / EPA / DEFRA)</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    placeholder="EPA / IPCC / DEFRA"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Source Version</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.sourceVersion}
                    onChange={e => setForm({ ...form, sourceVersion: e.target.value })}
                    placeholder="v2024"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Effective From</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.effectiveFrom}
                    onChange={e => setForm({ ...form, effectiveFrom: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Effective To</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.effectiveTo}
                    onChange={e => setForm({ ...form, effectiveTo: e.target.value })}
                  />
                </div>
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
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Optional notes or references"
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">Save Emission Factor</button>
                <button type="button" className="btn-google" onClick={() => setShowModal(false)}>Cancel</button>
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
