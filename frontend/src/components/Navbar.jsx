// =============================================
// frontend/src/components/Navbar.jsx
// =============================================
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, User, LayoutDashboard, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAgent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <nav className="app-navbar">
      <div className="app-navbar__inner">
        <div className="app-navbar__content">
          <Link to={isAgent ? '/agent/dashboard' : '/dashboard'} className="app-navbar__brand">
            <span className="app-navbar__logo">
              <Ticket size={21} />
            </span>
            <span className="app-navbar__brand-text">
              <span>SupportDesk</span>
              {!isAgent && <small>Customer Portal</small>}
            </span>
          </Link>

          <div className="app-navbar__actions">
            {isAgent ? (
              <Link to="/agent/dashboard" className="app-navbar__link">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            ) : (
              <div className="app-navbar__customer-nav">
                <Link to="/dashboard" className="app-navbar__link">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/tickets/new" className="app-navbar__primary">
                  <PlusCircle size={17} /> New Ticket
                </Link>
              </div>
            )}

            <div className="app-navbar__account">
              <div className="app-navbar__user">
                <span className="app-navbar__avatar">
                  <User size={17} />
                </span>
                <div className="app-navbar__user-copy">
                  <strong>{user?.name}</strong>
                  <span className={user?.role === 'agent' ? 'is-agent' : 'is-customer'}>{user?.role}</span>
                </div>
              </div>

              <button onClick={handleLogout} className="app-navbar__logout">
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
