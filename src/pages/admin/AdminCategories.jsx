import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';

const PAGE_SIZES = [10, 50, 100];

export default function AdminCategories({ token }) {
  const [categories, setCategories] = useState([]);
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
  const [form, setForm] = useState({ name: '', description: '', iconName: 'folder', displayOrder: 0, active: true });

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
    setForm({ name: '', description: '', iconName: 'folder', displayOrder: categories.length + 1, active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      iconName: cat.iconName || 'folder',
      displayOrder: cat.displayOrder || 0,
      active: cat.active,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editId) {
        await adminApi.updateCategory(token, editId, form);
        setSuccess('Category updated successfully');
      } else {
        await adminApi.createCategory(token, form);
        setSuccess('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate category '${name}'?`)) return;
    try {
      await adminApi.deleteCategory(token, id);
      setSuccess(`Category '${name}' deactivated`);
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="admin-sub-tab">
      {/* Top action bar */}
      <div className="admin-sub-header">
        <div>
          <h2 className="sub-title">Activity Categories</h2>
          <p className="sub-desc">Manage top-level activity categories (Transport, Electricity, Food, Shopping)</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          + Add Category
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {/* Table Card */}
      <div className="admin-table-card">
        <div className="admin-table-controls">
          <div className="admin-page-size">
            <label htmlFor="cat-page-size">Show</label>
            <select
              id="cat-page-size"
              className="admin-select"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="admin-record-info">
            {totalElements > 0 ? `Showing ${startRecord}–${endRecord} of ${totalElements}` : 'No categories found'}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Order</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Icon</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-table-empty">
                    <div className="admin-table-loader"><span className="spinner"></span> Loading categories...</div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="7" className="admin-table-empty">No categories configured yet</td></tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="td-id">{cat.id}</td>
                    <td>{cat.displayOrder}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</td>
                    <td>{cat.description || '—'}</td>
                    <td><code>{cat.iconName}</code></td>
                    <td>
                      <span className={`status-badge ${cat.active ? 'status-approved' : 'status-rejected'}`}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn action-approve" onClick={() => handleOpenEdit(cat)}>Edit</button>
                      {cat.active && (
                        <button className="action-btn action-reject" onClick={() => handleDelete(cat.id, cat.name)}>Deactivate</button>
                      )}
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
            <button className="pagination-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>«</button>
            <button className="pagination-btn" disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}>‹</button>
            <span className="pagination-pages">Page {currentPage + 1} of {totalPages}</span>
            <button className="pagination-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}>›</button>
            <button className="pagination-btn" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(totalPages - 1)}>»</button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSave} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="TRANSPORT"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Emissions from commuting and travel"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icon Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.iconName}
                    onChange={e => setForm({ ...form, iconName: e.target.value })}
                    placeholder="car"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">Save Category</button>
                <button type="button" className="btn-google" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
