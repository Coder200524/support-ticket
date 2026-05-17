// =============================================
// frontend/src/pages/CreateTicketPage.jsx
// =============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';

const CreateTicketPage = () => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', departmentId: '' });
  const [departments, setDepartments] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get('/departments');
        setDepartments(data.data.departments || []);
      } catch {
        toast.error('Unable to load departments. You can still create a ticket without one.');
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priority', form.priority);
      if (form.departmentId) {
        formData.append('departmentId', form.departmentId);
      }
      if (attachment) {
        formData.append('attachment', attachment);
      }

      const { data } = await api.post('/tickets', formData);

      if (data.success) {
        toast.success('Ticket created successfully! 🎫');
        navigate(`/tickets/${data.data.ticket.id}`);
      }
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors?.length) {
        errors.forEach(err => toast.error(err.message));
      } else {
        toast.error(error.response?.data?.message || 'Failed to create ticket.');
      }
    } finally {
      setLoading(false);
    }
  };

  const priorityInfo = {
    low: { color: '#3b82f6', desc: 'Not urgent, can wait' },
    medium: { color: '#f59e0b', desc: 'Normal priority' },
    high: { color: '#ef4444', desc: 'Urgent, needs quick attention' },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
                         cursor: 'pointer', color: 'var(--color-text-secondary)', marginBottom: '24px', fontFamily: 'Inter, sans-serif',
                         fontSize: '0.9rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="glass-card animate-fade-in-up" style={{ padding: '40px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
              Create Support Ticket
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Describe your issue and we'll get back to you as soon as possible.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title */}
            <div>
              <label htmlFor="ticket-title" style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
                Issue Title *
              </label>
              <input id="ticket-title" name="title" type="text" className="input-field"
                     placeholder="e.g., Cannot login to my account"
                     value={form.title} onChange={handleChange} required />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                Keep it short and descriptive ({form.title.length}/200)
              </p>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 500 }}>
                Priority Level *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {['low', 'medium', 'high'].map(level => (
                  <label key={level} style={{
                    border: `2px solid ${form.priority === level ? priorityInfo[level].color : 'var(--color-border)'}`,
                    borderRadius: '10px', padding: '14px 12px', cursor: 'pointer',
                    background: form.priority === level ? `rgba(${level === 'low' ? '59,130,246' : level === 'medium' ? '245,158,11' : '239,68,68'},0.1)` : 'transparent',
                    transition: 'all 0.2s', textAlign: 'center',
                  }}>
                    <input type="radio" name="priority" value={level}
                           checked={form.priority === level} onChange={handleChange}
                           style={{ display: 'none' }} />
                    <div style={{ fontWeight: 700, textTransform: 'capitalize', color: priorityInfo[level].color, marginBottom: '4px' }}>
                      {level === 'high' && <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />}
                      {level}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                      {priorityInfo[level].desc}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
                Department
              </label>
              <select id="department" name="departmentId" className="input-field"
                      value={form.departmentId} onChange={handleChange}>
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                Choose the team that should handle this issue.
              </p>
            </div>

            {/* Attachment */}
            <div>
              <label htmlFor="attachment" style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
                Attachment
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <label htmlFor="attachment" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(148,163,184,0.25)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', cursor: 'pointer', minWidth: '170px', fontWeight: 600, transition: 'background 0.2s' }}>
                  Upload File
                </label>
                <span style={{ color: attachment ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: '0.9rem', minWidth: '180px', wordBreak: 'break-all' }}>
                  {attachment ? attachment.name : 'No file selected'}
                </span>
              </div>
              <input id="attachment" type="file" accept="image/*,.pdf"
                     onChange={(e) => setAttachment(e.target.files[0] || null)}
                     style={{ display: 'none' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '8px' }}>
                Optional. Attach a screenshot, log file, or PDF to help support.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="ticket-desc" style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
                Detailed Description *
              </label>
              <textarea id="ticket-desc" name="description" className="input-field"
                        placeholder="Please describe your issue in detail. Include:&#10;- What happened?&#10;- What were you trying to do?&#10;- What did you expect to happen?&#10;- Any error messages you saw?"
                        value={form.description} onChange={handleChange} required
                        rows={8} style={{ resize: 'vertical', lineHeight: 1.6 }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '4px' }}>
                More detail = faster resolution ({form.description.length} characters)
              </p>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button id="create-ticket-submit" type="submit" className="btn-primary"
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px',
                               opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                <Send size={16} />
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateTicketPage;
