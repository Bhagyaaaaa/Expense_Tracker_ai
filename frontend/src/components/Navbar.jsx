import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="navbar">
      <div className="brand">
        Ledger <span>expense tracker + AI</span>
      </div>
      <div className="nav-right">
        <span>{user?.name}</span>
        <button className="btn btn-ghost btn-small" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}
