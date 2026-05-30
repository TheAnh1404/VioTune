import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { Mail, Lock, User } from 'lucide-react';
import AuthForm from './AuthForm';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [isActive, setIsActive] = useState(false);

  // SignUp state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  // SignIn state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // ── Handle Sign Up ───────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignUpError('');
    if (!signUpName.trim()) { setSignUpError('Please enter your name.'); return; }
    if (signUpPassword.length < 6) { setSignUpError('Password must be at least 6 characters.'); return; }

    setSignUpLoading(true);
    try {
      await signUp(signUpEmail, signUpPassword, signUpName.trim());
      navigate('/home');
    } catch (err) {
      const msg = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password is too weak.'
      }[err.code] || err.message;
      setSignUpError(msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  // ── Handle Sign In ───────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError('');
    setSignInLoading(true);
    try {
      await signIn(signInEmail, signInPassword);
      navigate('/home');
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/invalid-credential': 'Invalid email or password.'
      }[err.code] || 'Login failed. Please try again.';
      setSignInError(msg);
    } finally {
      setSignInLoading(false);
    }
  };

  const signUpInputs = [
    {
      type: 'text', name: 'name', placeholder: 'Your Name', icon: User,
      value: signUpName, onChange: (e) => setSignUpName(e.target.value), required: true
    },
    {
      type: 'email', name: 'email', placeholder: 'Email Address', icon: Mail,
      value: signUpEmail, onChange: (e) => setSignUpEmail(e.target.value), required: true
    },
    {
      type: 'password', name: 'password', placeholder: 'Password (min 6 chars)', icon: Lock,
      value: signUpPassword, onChange: (e) => setSignUpPassword(e.target.value), required: true
    }
  ];

  const signInInputs = [
    {
      type: 'email', name: 'email', placeholder: 'Email Address', icon: Mail,
      value: signInEmail, onChange: (e) => setSignInEmail(e.target.value), required: true
    },
    {
      type: 'password', name: 'password', placeholder: 'Password', icon: Lock,
      value: signInPassword, onChange: (e) => setSignInPassword(e.target.value), required: true
    }
  ];

  return (
    <div className={styles.bodyWrapper}>
      <div className={styles.backgroundGlow} />

      <div className={`${styles.container} ${isActive ? styles.active : ''}`} id="container">

        {/* Sign Up Form */}
        <AuthForm
          type="signup"
          title="Create Account"
          subtitle="Register with Email"
          buttonText={signUpLoading ? 'Creating...' : 'Sign Up'}
          inputs={signUpInputs}
          onSubmit={handleSignUp}
          error={signUpError}
        />

        {/* Sign In Form */}
        <AuthForm
          type="signin"
          title="Welcome Back"
          subtitle="Sign in to your VioTune account"
          buttonText={signInLoading ? 'Signing in...' : 'Sign In'}
          inputs={signInInputs}
          showForgot={false}
          onSubmit={handleSignIn}
          error={signInError}
        />

        {/* Toggle Panels */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <div className={`${styles.togglePanel} ${styles.toggleLeft}`}>
              <h1>Welcome Back!</h1>
              <p>Sign in to continue your music journey</p>
              <button className={styles.hidden} onClick={() => setIsActive(false)}>Sign In</button>
            </div>
            <div className={`${styles.togglePanel} ${styles.toggleRight}`}>
              <h1>Hello, Friend!</h1>
              <p>Create an account and discover music made for you</p>
              <button className={styles.hidden} onClick={() => setIsActive(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;