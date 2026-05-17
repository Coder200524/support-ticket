// =============================================
// frontend/src/pages/DashboardPage.jsx
// Customer Dashboard
// =============================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import TicketCard from '../components/TicketCard';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { PlusCircle, Ticket, CheckCircle2, Clock, AlertTriangle, Search, Filter } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: `rgba(${color}, 0.15)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 12px',
    }}>
      {icon}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/tickets?${params.toString()}`),
        api.get('/tickets/stats'),
      ]);

      setTickets(ticketsRes.data.data.tickets);
      setStats(statsRes.data.data.stats);
    } catch (error) {
      toast.error('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main className="page-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 className="page-title" style={{
            fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px',
          }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Here's an overview of your support tickets.
          </p>
        </div>

        {/* Stats Row */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <StatCard icon={<Ticket size={22} color="#10b981" />} label="Total" value={stats.total} color="16, 185, 129" />
          <StatCard icon={<AlertTriangle size={22} color="#3b82f6" />} label="Open" value={stats.open} color="59, 130, 246" />
          <StatCard icon={<Clock size={22} color="#f59e0b" />} label="Pending" value={stats.pending} color="245, 158, 11" />
          <StatCard icon={<CheckCircle2 size={22} color="#94a3b8" />} label="Closed" value={stats.closed} color="148, 163, 184" />
        </div>

        {/* Filters & Create Button */}
        <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--color-text-secondary)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" className="input-field" placeholder="Search tickets..."
                     value={search} onChange={e => setSearch(e.target.value)}
                     style={{ paddingLeft: '38px' }} />
            </div>
            <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Search</button>
          </form>

          {/* Status Filter */}
          <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: '130px' }}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select className="input-field" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                  style={{ width: 'auto', minWidth: '140px' }}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="ticket-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <Ticket size={48} color="var(--color-text-secondary)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>No tickets found</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
              {statusFilter || priorityFilter || search ? 'Try adjusting your filters.' : 'Create your first support ticket!'}
            </p>
            <Link to="/tickets/new">
              <button className="btn-primary">Create Ticket</button>
            </Link>
          </div>
        ) : (
          <div className="ticket-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
