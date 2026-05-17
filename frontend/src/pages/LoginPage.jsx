// =============================================
// frontend/src/pages/LoginPage.jsx
// =============================================
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Ticket, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to where they were before being sent to login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (data.success) {
        // Store user and token via context
        login(data.data.user, data.data.token);
        toast.success(`Welcome back, ${data.data.user.name}! 👋`);

        // Redirect based on role
        if (data.data.user.role === 'agent') {
          navigate('/agent/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-primary)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative circles */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        top: '-100px', left: '-100px', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        bottom: '-50px', right: '-50px', borderRadius: '50%',
      }} />

      {/* Login Card */}
      <div className="glass-card animate-fade-in-up" style={{
        width: '100%', maxWidth: '440px', padding: '48px 40px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            borderRadius: '16px', padding: '14px', marginBottom: '16px',
          }}>
            <Ticket size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
          }}>
            SupportDesk
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--color-text-secondary)"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--color-text-secondary)"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '8px',
                     opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <p style={{ textAlign: 'center', marginTop: '28px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            Create one →
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
