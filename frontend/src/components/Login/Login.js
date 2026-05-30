import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { Mail, Lock, User, Hash } from 'lucide-react';
import AuthForm from './AuthForm';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);

  // State for inputs
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInUserId, setSignInUserId] = useState("42"); // Default demo user ID

  const handleSignUp = (e) => {
    e.preventDefault();
    console.log("SignUp Submitted:", { signUpName, signUpEmail });
    // Randomize a user ID for new users between 1 and 200
    const randomId = Math.floor(Math.random() * 200) + 1;
    localStorage.setItem("user_id", randomId.toString());
    localStorage.setItem("username", signUpName || "Music Lover");
    navigate('/home');
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    console.log("SignIn Submitted:", { signInEmail, signInUserId });
    
    // Save to localStorage
    const finalUserId = signInUserId ? parseInt(signInUserId, 10) : 42;
    localStorage.setItem("user_id", finalUserId.toString());
    localStorage.setItem("username", signInEmail.split('@')[0] || "User " + finalUserId);
    
    navigate('/home');
  };

  const signUpInputs = [
    { type: "text", name: "name", placeholder: "Name", icon: User, value: signUpName, onChange: (e) => setSignUpName(e.target.value), required: true },
    { type: "email", name: "email", placeholder: "Enter E-mail", icon: Mail, value: signUpEmail, onChange: (e) => setSignUpEmail(e.target.value), required: true },
    { type: "password", name: "password", placeholder: "Enter Password", icon: Lock, value: signUpPassword, onChange: (e) => setSignUpPassword(e.target.value), required: true }
  ];

  const signInInputs = [
    { type: "email", name: "email", placeholder: "Enter E-mail", icon: Mail, value: signInEmail, onChange: (e) => setSignInEmail(e.target.value), required: true },
    { type: "password", name: "password", placeholder: "Password", icon: Lock, value: signInPassword, onChange: (e) => setSignInPassword(e.target.value), required: true },
    { type: "number", name: "userId", placeholder: "Demo User ID (1-200)", icon: Hash, value: signInUserId, onChange: (e) => setSignInUserId(e.target.value), required: true }
  ];

  return (
    <div className={styles.bodyWrapper}>
      <div className={styles.backgroundGlow} />
      
      <div className={`${styles.container} ${isActive ? styles.active : ''}`} id="container">
        
        {/* State-driven Auth Forms */}
        <AuthForm 
          type="signup" 
          title="Create Account" 
          subtitle="Register with E-mail"
          buttonText="Sign Up"
          inputs={signUpInputs}
          onSubmit={handleSignUp}
        />

        <AuthForm 
          type="signin" 
          title="Sign In" 
          subtitle="Sign in With Email & Password"
          buttonText="Sign In"
          inputs={signInInputs}
          showForgot={true}
          onSubmit={handleSignIn}
        />

        {/* Toggle Panels Overlay */}
        <div className={styles.toggleContainer}>
          <div className={styles.toggle}>
            <div className={`${styles.togglePanel} ${styles.toggleLeft}`}>
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className={styles.hidden} onClick={() => setIsActive(false)}>Sign In</button>
            </div>
            <div className={`${styles.togglePanel} ${styles.toggleRight}`}>
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className={styles.hidden} onClick={() => setIsActive(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;