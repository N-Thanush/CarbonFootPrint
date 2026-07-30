import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api';

const PAGE_SIZES = [10, 50, 100];

export default function AdminEmissionFactors({ token }) {
  const [factors, setFactors] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
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
  const [form, setForm] = useState({
    activityTypeId: '',
    kgCo2PerUnit: 0.21,
    source: 'EPA',
    effectiveFrom: '',
    effectiveTo: '',
    active: true,
  });

  const fetchActivityTypes = useCallback(async () => {
    try {
      const res = await adminApi.getActivityTypes(token, { page: 0, size: 100 });
      setActivityTypes(res.content || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchFactors = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getEmissionFactors(token, {
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
  }, [token, selectedTypeFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchActivityTypes();
  }, [fetchActivityTypes]);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const handleOpenCreate = () => {
    setEditId(null);
    setForm({
      activityTypeId: activityTypes[0]?.id || '',
      kgCo2PerUnit: 0.21,
      source: 'EPA',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ef) => {
    setEditId(ef.id);
    setForm({
      activityTypeId: ef.activityTypeId,
      kgCo2PerUnit: ef.kgCo2PerUnit,
      source: ef.source || '',
      effectiveFrom: ef.effectiveFrom || '',
      effectiveTo: ef.effectiveTo || '',
      active: ef.active,
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
        setSuccess('Emission factor updated');
      } else {
        await adminApi.createEmissionFactor(token, form);
        setSuccess('Emission factor created');
      }
      setShowModal(false);
      fetchFactors();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this emission factor?')) return;
    try {
      await adminApi.deleteEmissionFactor(token, id);
      setSuccess('Emission factor deactivated');
      fetchFactors();
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
          <h2 className="sub-title">Emission Factors</h2>
          <p className="sub-desc">Configure CO₂ emission conversion rates per activity unit (e.g. 1 km Car = 0.21 kg CO₂)</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>+ Add Emission Factor</button>
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
              <label>Activity Filter:</label>
              <select className="admin-select" value={selectedTypeFilter} onChange={e => { setSelectedTypeFilter(e.target.value); setCurrentPage(0); }}>
                <option value="">All Activity Types</option>
                {activityTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.categoryName})</option>)}
              </select>
            </div>
          </div>
          <div className="admin-record-info">
            {totalElements > 0 ? `Showing ${startRecord}–${endRecord} of ${totalElements}` : 'No emission factors found'}
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Activity Type</th>
                <th>kg CO₂ / Unit</th>
                <th>Source</th>
                <th>Effective From</th>
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
              ) : factors.length === 0 ? (
                <tr><td colSpan="8" className="admin-table-empty">No emission factors found</td></tr>
              ) : (
                factors.map((ef) => (
                  <tr key={ef.id}>
                    <td className="td-id">{ef.id}</td>
                    <td><span className="doc-badge">{ef.categoryName}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ef.activityTypeName}</td>
                    <td style={{ color: 'var(--green-400)', fontWeight: 700 }}>{ef.kgCo2PerUnit} kg / {ef.unit}</td>
                    <td>{ef.source || '—'}</td>
                    <td>{ef.effectiveFrom || '—'}</td>
                    <td>
                      <span className={`status-badge ${ef.active ? 'status-approved' : 'status-rejected'}`}>
                        {ef.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn action-approve" onClick={() => handleOpenEdit(ef)}>Edit</button>
                      {ef.active && (
                        <button className="action-btn action-reject" onClick={() => handleDelete(ef.id)}>Deactivate</button>
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
            <h3 className="modal-title">{editId ? 'Edit Emission Factor' : 'Add Emission Factor'}</h3>
            <form onSubmit={handleSave} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Activity Type *</label>
                <select
                  className="form-select"
                  value={form.activityTypeId}
                  onChange={e => setForm({ ...form, activityTypeId: e.target.value })}
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
                  <label className="form-label">Data Source</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    placeholder="EPA / IPCC / India CEA"
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
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit">Save Emission Factor</button>
                <button type="button" className="btn-google" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
