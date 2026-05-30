import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { Mail, Lock, User } from 'lucide-react';
import AuthForm from './AuthForm';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { signUp, signIn, resetPassword } = useAuth();
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

  // Forgot Password state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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

  // ── Handle Reset Password ────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail.trim()) { setForgotError('Please enter your email.'); return; }

    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotSuccess('A password reset link has been sent to your email.');
    } catch (err) {
      const msg = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/invalid-email': 'Invalid email address.'
      }[err.code] || err.message;
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
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

  const forgotInputs = [
    {
      type: 'email', name: 'email', placeholder: 'Email Address', icon: Mail,
      value: forgotEmail, onChange: (e) => setForgotEmail(e.target.value), required: true
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

        {/* Sign In / Reset Password Form */}
        {isForgotMode ? (
          <AuthForm
            type="signin"
            title="Reset Password"
            subtitle="Receive a password reset link by email"
            buttonText={forgotLoading ? 'Sending...' : 'Send Reset Link'}
            inputs={forgotInputs}
            onSubmit={handleResetPassword}
            error={forgotError}
          >
            {forgotSuccess && (
              <div style={{
                color: '#4ade80',
                fontSize: '13px',
                padding: '8px 12px',
                background: 'rgba(74,222,128,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(74,222,128,0.3)',
                marginBottom: '8px',
                textAlign: 'center',
                width: '100%'
              }}>
                {forgotSuccess}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setForgotError('');
                setForgotSuccess('');
              }}
              className={styles.forgot}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '10px', display: 'block' }}
            >
              Back to Sign In
            </button>
          </AuthForm>
        ) : (
          <AuthForm
            type="signin"
            title="Welcome Back"
            subtitle="Sign in to your VioTune account"
            buttonText={signInLoading ? 'Signing in...' : 'Sign In'}
            inputs={signInInputs}
            showForgot={true}
            onForgotClick={() => setIsForgotMode(true)}
            onSubmit={handleSignIn}
            error={signInError}
          />
        )}

        {/* Toggle Panels */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <div className={`${styles.togglePanel} ${styles.toggleLeft}`}>
              <h1>Welcome Back!</h1>
              <p>Sign in to continue your music journey</p>
              <button className={styles.hidden} onClick={() => { setIsActive(false); setIsForgotMode(false); }}>Sign In</button>
            </div>
            <div className={`${styles.togglePanel} ${styles.toggleRight}`}>
              <h1>Hello, Friend!</h1>
              <p>Create an account and discover music made for you</p>
              <button className={styles.hidden} onClick={() => { setIsActive(true); setIsForgotMode(false); }}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;