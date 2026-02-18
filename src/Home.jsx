import { useEffect, useMemo, useState } from 'react';
import Login from './components/Login';
import Signup from './components/Sign-up';
import ChatPage from './chat/chatpage';
import { hasAuthSession } from './utils/authSession';
import './styles/theme.css';
import './styles/home-auth.css';

const AUTH_VIEW_STORAGE_KEY = 'chatapp-auth-view';
const AUTH_VIEWS = {
  LANDING: 'landing',
  LOGIN: 'login',
  SIGNUP: 'signup',
};

function hasActiveSession() {
  return hasAuthSession();
}

function getStoredAuthView() {
  const storedView = sessionStorage.getItem(AUTH_VIEW_STORAGE_KEY);

  if (storedView === AUTH_VIEWS.LANDING || storedView === AUTH_VIEWS.LOGIN || storedView === AUTH_VIEWS.SIGNUP) {
    return storedView;
  }

  return AUTH_VIEWS.LANDING;
}

function createParticles(count) {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    animationDelay: `${Math.random() * 10}s`,
    animationDuration: `${Math.random() * 10 + 10}s`,
  }));
}

function ParticleField({ count }) {
  const particles = useMemo(() => createParticles(count), [count]);

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((particle, i) => (
        <div key={i} className="particle" style={particle} />
      ))}
    </div>
  );
}

function Home() {
  const [authView, setAuthView] = useState(() => getStoredAuthView());
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasActiveSession());
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.removeItem(AUTH_VIEW_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(AUTH_VIEW_STORAGE_KEY, authView);
  }, [authView, isLoggedIn]);

  useEffect(() => {
    const syncSessionState = () => {
      setIsLoggedIn(hasActiveSession());
    };

    syncSessionState();
    window.addEventListener('storage', syncSessionState);

    return () => {
      window.removeEventListener('storage', syncSessionState);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const themeTogglePosition = {
    position: 'fixed',
    top: 'max(1rem, env(safe-area-inset-top))',
    right: 'max(1rem, env(safe-area-inset-right))',
    zIndex: 20,
  };

  if (isLoggedIn) {
    return (
      <>
        <ParticleField count={20} />
        <ChatPage theme={theme} setTheme={setTheme} />
      </>
    );
  }

  if (authView === AUTH_VIEWS.LANDING) {
    return (
      <div className="landing-page">
        <ParticleField count={15} />
        <h1>Welcome to ChatApp!</h1>
        <p className="landing-subtitle">
          Experience the future of conversation with our Liquid Glass interface.
        </p>
        <button
          className="begin-btn"
          onClick={() => {
            setAuthView(AUTH_VIEWS.LOGIN);
          }}
        >
          Let&apos;s Begin
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <ParticleField count={10} />
      <button
        className="theme-toggle-btn"
        style={themeTogglePosition}
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="theme-toggle-btn__icon" aria-hidden="true">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" role="presentation">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" role="presentation">
              <path d="M20.4 14.5a8.7 8.7 0 1 1-10.9-10.9 7.4 7.4 0 1 0 10.9 10.9z" />
            </svg>
          )}
        </span>
      </button>
      <h1>{authView === AUTH_VIEWS.LOGIN ? 'Welcome Back' : 'Create Account'}</h1>

      {authView === AUTH_VIEWS.LOGIN ? (
        <Login
          onLoginSuccess={() => setIsLoggedIn(hasActiveSession())}
          onSwitchToSignup={() => setAuthView(AUTH_VIEWS.SIGNUP)}
        />
      ) : (
        <Signup
          onSignupSuccess={() => {
            setAuthView(AUTH_VIEWS.LOGIN);
            alert('Account created! Please login with your credentials.');
          }}
          onSwitchToLogin={() => setAuthView(AUTH_VIEWS.LOGIN)}
        />
      )}
    </div>
  );
}

export default Home;
