// =============================================
// frontend/src/components/TicketCard.jsx
// =============================================
// A reusable card component for displaying a ticket preview
import { Link } from 'react-router-dom';
import { MessageSquare, Clock, AlertCircle, User, Paperclip } from 'lucide-react';

const priorityConfig = {
  low: { class: 'badge-low', label: 'Low' },
  medium: { class: 'badge-medium', label: 'Medium' },
  high: { class: 'badge-high', label: 'High' },
};

const statusConfig = {
  open: { class: 'badge-open', label: 'Open' },
  pending: { class: 'badge-pending', label: 'Pending' },
  closed: { class: 'badge-closed', label: 'Closed' },
};

const TicketCard = ({ ticket }) => {
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const status = statusConfig[ticket.status] || statusConfig.open;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <Link to={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
      <div className="glass-card animate-fade-in-up"
           style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.3s ease' }}
           onMouseEnter={e => {
             e.currentTarget.style.transform = 'translateY(-2px)';
             e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.5)';
             e.currentTarget.style.boxShadow = '0 8px 30px rgba(124, 58, 237, 0.15)';
           }}
           onMouseLeave={e => {
             e.currentTarget.style.transform = 'translateY(0)';
             e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
             e.currentTarget.style.boxShadow = 'none';
           }}
      >
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={status.class}>{status.label}</span>
            <span className={priority.class}>{priority.label}</span>
          </div>
          {ticket.priority === 'high' && (
            <AlertCircle size={18} color="#ef4444" />
          )}
        </div>

        {/* Title */}
        <h3 style={{
          color: 'var(--color-text-primary)',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '8px',
          lineHeight: 1.4,
        }}>
          {ticket.title}
        </h3>

        {/* Description Preview */}
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          {ticket.description}
        </p>

        {/* Footer Row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid rgba(51, 65, 85, 0.4)',
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Created by */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
              <User size={13} />
              <span>{ticket.createdBy?.name || 'Unknown'}</span>
            </div>

            {/* Comment count */}
            {ticket._count?.comments !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                <MessageSquare size={13} />
                <span>{ticket._count.comments}</span>
              </div>
            )}

            {/* Attachment count */}
            {ticket._count?.attachments > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginLeft: '4px' }}>
                <Paperclip size={13} />
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
            <Clock size={13} />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TicketCard;
