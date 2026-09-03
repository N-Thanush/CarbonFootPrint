import React, { useState, useEffect, useCallback } from 'react';
import { articleApi } from '../../api';

export default function AdminArticles() {
  const token = localStorage.getItem('token');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Sustainability',
    author: 'Admin Team',
    published: true,
  });

  const fetchArticles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await articleApi.adminGetArticles(token, { page: 0, size: 50 });
      setArticles(res.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setForm({
      title: '',
      summary: '',
      content: '',
      category: 'Sustainability',
      author: 'Admin Team',
      published: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category || 'Sustainability',
      author: article.author || 'Admin Team',
      published: article.published ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingArticle) {
        await articleApi.adminUpdateArticle(token, editingArticle.id, form);
        setSuccess('Article updated successfully!');
      } else {
        await articleApi.adminCreateArticle(token, form);
        setSuccess('Article created and published successfully!');
      }
      setShowModal(false);
      fetchArticles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete article "${title}"?`)) return;
    try {
      await articleApi.adminDeleteArticle(token, id);
      setSuccess('Article deleted successfully');
      fetchArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTogglePublish = async (article) => {
    try {
      await articleApi.adminUpdateArticle(token, article.id, { published: !article.published });
      setSuccess(`Article ${!article.published ? 'Published' : 'Unpublished'} successfully`);
      fetchArticles();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-sub-tab">
      <div className="admin-sub-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="sub-title">Sustainability Articles CMS</h2>
          <p className="sub-desc">Create, publish, and manage environmental & eco-living articles</p>
        </div>
        <button className="btn-submit" onClick={handleOpenCreate} style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
          + Create New Article
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ margin: '1rem 0' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ margin: '1rem 0' }}>{success}</div>}

      <div className="admin-table-card" style={{ marginTop: '1rem' }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="admin-table-empty">Loading articles...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan="6" className="admin-table-empty">No articles created yet. Click "+ Create New Article" to write one!</td></tr>
              ) : (
                articles.map((art) => (
                  <tr key={art.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{art.title}</td>
                    <td>
                      <span className="doc-badge" style={{ backgroundColor: '#10B981', color: '#fff' }}>
                        {art.category || 'Sustainability'}
                      </span>
                    </td>
                    <td>{art.author}</td>
                    <td>
                      <button
                        onClick={() => handleTogglePublish(art)}
                        style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          backgroundColor: art.published ? '#16A34A' : '#64748B',
                          color: '#FFF'
                        }}
                      >
                        {art.published ? 'PUBLISHED' : 'DRAFT'}
                      </button>
                    </td>
                    <td>{art.createdAt ? art.createdAt.split(' ')[0] : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="action-btn action-approve" onClick={() => handleOpenEdit(art)}>Edit</button>
                        <button className="action-btn action-reject" onClick={() => handleDelete(art.id, art.title)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT ARTICLE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3 className="modal-title">{editingArticle ? 'Edit Article' : 'Create New Sustainability Article'}</h3>
            <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Article Title *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Author Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Summary / Short Teaser *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Article Full Content *</label>
                <textarea
                  className="form-input"
                  rows="6"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}
                </button>
                <button type="button" className="btn-google" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
