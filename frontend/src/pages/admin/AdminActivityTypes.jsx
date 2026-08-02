import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';

const PAGE_SIZES = [10, 50, 100];

export default function AdminActivityTypes({ token }) {
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ categoryId: '', name: '', description: '', unit: 'km', active: true });

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
      name: '',
      description: '',
      unit: 'km',
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditId(t.id);
    setForm({
      categoryId: t.categoryId,
      name: t.name,
      description: t.description || '',
      unit: t.unit,
      active: t.active,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await adminApi.updateActivityType(token, editId, form);
        setSuccess('Activity type updated');
      } else {
        await adminApi.createActivityType(token, form);
        setSuccess('Activity type created');
      }
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate activity type '${name}'?`)) return;
    try {
      await adminApi.deleteActivityType(token, id);
      setSuccess(`Activity type '${name}' deactivated`);
      fetchTypes();
    } catch (err) {
      setError(err.message);
    }
  };

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="admin-sub-tab">
      <div className="admin-sub-header">
        <div>
          <h2 className="sub-title">Activity Types</h2>
          <p className="sub-desc">Define activity options within categories (e.g. Car, Bus, Grid Electricity, Beef Meal)</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>+ Add Activity Type</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      <div className="admin-table-card">
        <div className="admin-table-controls">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="admin-page-size">
              <label>Show</label>
              <select className="admin-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}>
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="admin-page-size">
              <label>Category Filter:</label>
              <select className="admin-select" value={selectedCatFilter} onChange={e => { setSelectedCatFilter(e.target.value); setCurrentPage(0); }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="admin-record-info">
            {totalElements > 0 ? `Showing ${startRecord}–${endRecord} of ${totalElements}` : 'No activity types found'}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Activity Type Name</th>
                <th>Unit</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-table-empty">
                    <div className="admin-table-loader"><span className="spinner"></span> Loading activity types...</div>
                  </td>
                </tr>
              ) : types.length === 0 ? (
                <tr><td colSpan="7" className="admin-table-empty">No activity types found</td></tr>
              ) : (
                types.map((t) => (
                  <tr key={t.id}>
                    <td className="td-id">{t.id}</td>
                    <td><span className="doc-badge">{t.categoryName}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</td>
                    <td><code>{t.unit}</code></td>
                    <td>{t.description || '—'}</td>
                    <td>
                      <span className={`status-badge ${t.active ? 'status-approved' : 'status-rejected'}`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn action-approve" onClick={() => handleOpenEdit(t)}>Edit</button>
                      {t.active && (
                        <button className="action-btn action-reject" onClick={() => handleDelete(t.id, t.name)}>Deactivate</button>
                      )}
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Activity Type Name *</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Car (Gasoline)"
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
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about this activity"
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
    </div>
  );
}
