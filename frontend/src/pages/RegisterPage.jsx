// =============================================
// frontend/src/pages/RegisterPage.jsx
// =============================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Ticket, User, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email,
        password: form.password, role: form.role,
      });

      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success('Account created successfully! 🎉');
        navigate(data.data.user.role === 'agent' ? '/agent/dashboard' : '/dashboard', { replace: true });
      }
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors?.length) {
        errors.forEach(err => toast.error(err.message));
      } else {
        toast.error(error.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-primary)', padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        top: '-150px', right: '-100px', borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
        bottom: '-50px', left: '-50px', borderRadius: '50%',
      }} />

      <div className="glass-card auth-card animate-fade-in-up" style={{
        width: '100%', maxWidth: '480px', padding: '48px 40px', position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            borderRadius: '16px', padding: '14px', marginBottom: '16px',
          }}>
            <Ticket size={32} color="white" />
          </div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px',
          }}>Create Account</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Join SupportDesk today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--color-text-secondary)"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input id="reg-name" type="text" name="name" className="input-field"
                     placeholder="John Smith" value={form.name} onChange={handleChange}
                     required style={{ paddingLeft: '42px' }} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--color-text-secondary)"
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input id="reg-email" type="email" name="email" className="input-field"
                     placeholder="you@example.com" value={form.email} onChange={handleChange}
                     required style={{ paddingLeft: '42px' }} />
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              Account Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { value: 'customer', label: 'Customer', icon: '👤', desc: 'Submit & track tickets' },
                { value: 'agent', label: 'Agent', icon: '🛡️', desc: 'Manage & resolve tickets' },
              ].map(({ value, label, icon, desc }) => (
                <label key={value} style={{
                  border: `2px solid ${form.role === value ? '#7c3aed' : 'var(--color-border)'}`,
                  borderRadius: '10px', padding: '12px', cursor: 'pointer',
                  background: form.role === value ? 'rgba(124,58,237,0.1)' : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <input type="radio" name="role" value={value}
                         checked={form.role === value} onChange={handleChange}
                         style={{ display: 'none' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>{icon}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{desc}</div>
                  </div>
                </label>
              ))}
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
              <input id="reg-password" type={showPassword ? 'text' : 'password'} name="password"
                     className="input-field" placeholder="Min. 6 characters" value={form.password}
                     onChange={handleChange} required style={{ paddingLeft: '42px', paddingRight: '42px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                               background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Shield size={16} color="var(--color-text-secondary)"
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input id="reg-confirm-password" type={showPassword ? 'text' : 'password'} name="confirmPassword"
                     className="input-field" placeholder="Repeat password" value={form.confirmPassword}
                     onChange={handleChange} required style={{ paddingLeft: '42px' }} />
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginTop: '8px',
                           opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
