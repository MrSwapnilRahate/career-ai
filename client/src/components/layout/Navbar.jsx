import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Don't show navbar on landing page
  const isLanding = location.pathname === '/';

  return (
    <nav className={`navbar ${isLanding ? 'navbar-landing' : 'navbar-app'}`}>
      <div className="navbar-inner">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#g1)" />
              <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="21" cy="18" r="3" fill="#fff" fillOpacity="0.9" />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#3b82f6" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-text">Career<span className="text-gradient">AI</span></span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/upload" className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}>
                Upload
              </Link>
              <div className="nav-dropdown">
                <span className="nav-link nav-dropdown-trigger">Tools ▾</span>
                <div className="nav-dropdown-menu">
                  <Link to="/job-match" className="dropdown-item">🎯 Job Match</Link>
                  <Link to="/cover-letter" className="dropdown-item">📝 Cover Letter</Link>
                  <Link to="/interview-prep" className="dropdown-item">🎤 Interview Prep</Link>
                  <Link to="/skills-gap" className="dropdown-item">📊 Skills Gap</Link>
                  <Link to="/salary-insights" className="dropdown-item">💰 Salary Insights</Link>
                  <Link to="/linkedin" className="dropdown-item">💼 LinkedIn Optimizer</Link>
                  <Link to="/photo-studio" className="dropdown-item">📸 Photo Studio</Link>
                </div>
              </div>
              <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
                History
              </Link>
              <div className="nav-divider" />
              {user?.subscription?.plan && user.subscription.plan !== 'free' && (
                <span className="plan-badge-nav">{user.subscription.plan.toUpperCase()}</span>
              )}
              <div className="user-menu">
                <div className="user-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-email">{user?.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">Profile</Link>
                  <Link to="/pricing" className="dropdown-item">Pricing</Link>
                  <button onClick={handleLogout} className="dropdown-item dropdown-logout">Logout</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/pricing" className="nav-link">Pricing</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
