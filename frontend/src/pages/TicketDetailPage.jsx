// =============================================
// frontend/src/pages/TicketDetailPage.jsx
// =============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, Lock, User, Clock, RefreshCw, FileText, Download, Layers } from 'lucide-react';

const statusConfig = {
  open: { class: 'badge-open', label: 'Open' },
  pending: { class: 'badge-pending', label: 'Pending' },
  closed: { class: 'badge-closed', label: 'Closed' },
};
const priorityConfig = {
  low: { class: 'badge-low', label: 'Low' },
  medium: { class: 'badge-medium', label: 'Medium' },
  high: { class: 'badge-high', label: 'High' },
};

const TicketDetailPage = () => {
  const { id } = useParams();
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const backendURL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const socket = io(backendURL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinTicket', id);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('newComment', (newComment) => {
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        };
      });
    });

    fetchTicket();

    return () => {
      socket.emit('leaveTicket', id);
      socket.disconnect();
    };
  }, [id]);

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.data.ticket);
    } catch {
      toast.error('Ticket not found.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/tickets/${id}`, { status: newStatus });
      setTicket(data.data.ticket);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/comments', { ticketId: id, message: comment, isInternalNote: isInternal });
      setComment('');
      toast.success('Comment added!');
      fetchTicket(); // Refresh to show new comment
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const timelineItems = ticket ? [
    ...(ticket.comments || []).map((comment) => ({ type: 'comment', item: comment })),
    ...(ticket.activities || []).map((activity) => ({ type: 'activity', item: activity })),
  ].sort((a, b) => new Date(a.item.createdAt) - new Date(b.item.createdAt)) : [];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
        <Navbar />
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px', marginBottom: '16px' }} />
          <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />
        </main>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main className="page-main" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
                         cursor: 'pointer', color: 'var(--color-text-secondary)', marginBottom: '24px',
                         fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* Ticket Header */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '32px', marginBottom: '20px' }}>
          <div className="ticket-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className={statusConfig[ticket.status]?.class}>{statusConfig[ticket.status]?.label}</span>
              <span className={priorityConfig[ticket.priority]?.class}>{priorityConfig[ticket.priority]?.label}</span>
            </div>

            {/* Agent: Status Update Dropdown */}
            {isAgent && (
              <select value={ticket.status} onChange={e => handleStatusChange(e.target.value)}
                      disabled={updating} className="input-field"
                      style={{ width: 'auto', fontSize: '0.85rem', padding: '6px 12px' }}>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            )}
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', lineHeight: 1.3 }}>
            {ticket.title}
          </h1>

          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </p>

          {/* Meta Info */}
          <div className="ticket-meta" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              <User size={14} />
              <span>Created by <strong style={{ color: 'var(--color-text-primary)' }}>{ticket.createdBy?.name}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              <Clock size={14} />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            {ticket.assignedTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <User size={14} />
                <span>Assigned to <strong style={{ color: '#a78bfa' }}>{ticket.assignedTo.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {ticket.attachments?.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              Attachments
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {ticket.attachments.map((file) => (
                <a key={file.id} href={file.url} target="_blank" rel="noreferrer"
                   style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '14px', background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(71,85,105,0.15)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(59,130,246,0.15)', display: 'grid', placeItems: 'center' }}>
                    <Download size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{file.filename}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {file.mimeType.toUpperCase()} • {formatDate(file.createdAt)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '24px' }}>
            Comments & Activity ({timelineItems.length})
          </h2>

          {/* Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {timelineItems.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                No activity yet. Add the first comment or update the ticket.
              </p>
            ) : (
              timelineItems.map((entry, index) => {
                if (entry.type === 'activity') {
                  return (
                    <div key={`activity-${entry.item.id}-${index}`} style={{
                      padding: '16px', borderRadius: '12px', background: 'rgba(71, 85, 105, 0.08)',
                      border: '1px solid rgba(71, 85, 105, 0.18)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={14} color="#3b82f6" />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                            {entry.item.action.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          {formatDate(entry.item.createdAt)}
                        </span>
                      </div>
                      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                        <strong>{entry.item.user?.name || 'System'}</strong> updated this ticket.
                        {entry.item.oldValue && entry.item.newValue && (
                          <span> Changed from <strong>{entry.item.oldValue}</strong> to <strong>{entry.item.newValue}</strong>.</span>
                        )}
                      </p>
                    </div>
                  );
                }

                const c = entry.item;
                return (
                  <div key={c.id} style={{
                    padding: '16px', borderRadius: '12px',
                    background: c.isInternalNote
                      ? 'rgba(245, 158, 11, 0.08)'
                      : c.user?.role === 'agent'
                        ? 'rgba(124, 58, 237, 0.08)'
                        : 'rgba(15, 15, 26, 0.6)',
                    border: `1px solid ${c.isInternalNote ? 'rgba(245,158,11,0.2)' : c.user?.role === 'agent' ? 'rgba(124,58,237,0.2)' : 'rgba(51,65,85,0.3)'}`,
                  }}>
                      <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: c.user?.role === 'agent' ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : 'rgba(94,234,212,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <User size={13} color="white" />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                          {c.user?.name}
                        </span>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                          color: c.user?.role === 'agent' ? '#a78bfa' : '#34d399',
                          letterSpacing: '0.5px',
                        }}>
                          {c.user?.role}
                        </span>
                        {c.isInternalNote && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#f59e0b' }}>
                            <Lock size={11} /> Internal Note
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6, fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      {c.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Comment Form */}
          {ticket.status !== 'closed' && (
            <form onSubmit={handleAddComment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
                  Add a Comment
                </label>
                <textarea className="input-field"
                          placeholder={isInternal ? '🔒 Internal note - only agents will see this...' : 'Write your response...'}
                          value={comment} onChange={e => setComment(e.target.value)}
                          rows={4} required style={{ resize: 'vertical' }} />
              </div>

              {/* Internal Note Toggle (agents only) */}
              {isAgent && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                         style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={13} /> Mark as internal note (only visible to agents)
                  </span>
                </label>
              )}

              <button type="submit" className="btn-primary" disabled={submitting || !comment.trim()}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px',
                               opacity: submitting || !comment.trim() ? 0.7 : 1,
                               cursor: submitting || !comment.trim() ? 'not-allowed' : 'pointer' }}>
                <Send size={16} /> {submitting ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          )}

          {ticket.status === 'closed' && (
            <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(148,163,184,0.05)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                This ticket is closed. Comments are disabled.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TicketDetailPage;
