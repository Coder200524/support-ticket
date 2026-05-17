// =============================================
// frontend/src/pages/AgentDashboardPage.jsx
// =============================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import TicketCard from '../components/TicketCard';
import toast from 'react-hot-toast';
import { Ticket, Users, CheckCircle2, Clock, AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';

const StatCard = ({ icon, label, value, color, bgColor }) => (
  <div className="glass-card" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
      </div>
    </div>
  </div>
);

const AgentDashboardPage = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, pending: 0, closed: 0, total: 0 });
  const [analytics, setAnalytics] = useState({ weeklyActivity: [], departmentBreakdown: [], topAgents: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (search) params.append('search', search);
      params.append('page', currentPage);
      params.append('limit', 12);

      const [ticketsRes, statsRes, analyticsRes] = await Promise.all([
        api.get(`/tickets?${params.toString()}`),
        api.get('/tickets/stats'),
        api.get('/analytics/summary'),
      ]);

      setTickets(ticketsRes.data.data.tickets);
      setPagination(ticketsRes.data.data.pagination);
      setStats(statsRes.data.data.stats);
      setAnalytics(analyticsRes.data.data.summary || {});
    } catch {
      toast.error('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <Navbar />

      <main className="page-main" style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div className="agent-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Agent Dashboard 🛡️
            </h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Welcome, <strong style={{ color: '#a78bfa' }}>{user?.name}</strong>. Manage all customer support tickets.
            </p>
          </div>
          <button onClick={() => fetchData()}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--color-border)',
                           color: 'var(--color-text-secondary)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                           fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <StatCard icon={<Ticket size={24} color="#10b981" />} label="Total Tickets" value={stats.total}
                    bgColor="rgba(16,185,129,0.15)" />
          <StatCard icon={<AlertTriangle size={24} color="#3b82f6" />} label="Open" value={stats.open}
                    bgColor="rgba(59,130,246,0.15)" />
          <StatCard icon={<Clock size={24} color="#f59e0b" />} label="Pending" value={stats.pending}
                    bgColor="rgba(245,158,11,0.15)" />
          <StatCard icon={<CheckCircle2 size={24} color="#94a3b8" />} label="Resolved" value={stats.closed}
                    bgColor="rgba(148,163,184,0.15)" />
        </div>

        {/* Analytics */}
        <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>Weekly Ticket Activity</h2>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Last 7 days</span>
            </div>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer>
                <LineChart data={analytics.weeklyActivity || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="day" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip wrapperStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="ticketCount" stroke="#60a5fa" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.05rem' }}>By Department</h2>
              </div>
              <div style={{ width: '100%', height: '180px' }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.departmentBreakdown || []} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                    <XAxis type="number" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                    <YAxis dataKey="department" type="category" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} width={110} />
                    <Tooltip wrapperStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '12px' }} />
                    <Bar dataKey="ticketCount" fill="#38bdf8" radius={[10, 10, 10, 10]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>


          </div>
        </div>

        {/* Filters */}
        <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, minWidth: '200px', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--color-text-secondary)"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" className="input-field" placeholder="Search all tickets..."
                     value={search} onChange={e => setSearch(e.target.value)}
                     style={{ paddingLeft: '38px' }} />
            </div>
            <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>Search</button>
          </form>

          <select className="input-field" value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  style={{ width: 'auto', minWidth: '130px' }}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>

          <select className="input-field" value={priorityFilter}
                  onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                  style={{ width: 'auto', minWidth: '140px' }}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="ticket-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
            <Ticket size={48} color="var(--color-text-secondary)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>No tickets found</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="ticket-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {tickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                <button className="btn-secondary" onClick={() => setCurrentPage(p => p - 1)}
                        disabled={!pagination.hasPrevPage}
                        style={{ opacity: !pagination.hasPrevPage ? 0.4 : 1 }}>
                  ← Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button className="btn-secondary" onClick={() => setCurrentPage(p => p + 1)}
                        disabled={!pagination.hasNextPage}
                        style={{ opacity: !pagination.hasNextPage ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AgentDashboardPage;
