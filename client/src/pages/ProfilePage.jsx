import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="profile-page fade-in">
      <div className="container">
        <h1>Your <span className="text-gradient">Profile</span></h1>

        <div className="profile-card glass-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="profile-info">
            <h2>{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>
            <p className="profile-joined">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
