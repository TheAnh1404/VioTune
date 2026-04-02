import React, { useState } from 'react';
import styles from './Login.module.css';
import { Mail, Lock, User } from 'lucide-react';
import AuthForm from './AuthForm';

const AuthPage = () => {
  const [isActive, setIsActive] = useState(false);

  // Cấu hình form chung
  const handleSignUp = (e) => { e.preventDefault(); console.log("SignUp Submitted"); };
  const handleSignIn = (e) => { e.preventDefault(); console.log("SignIn Submitted"); };

  const signUpInputs = [
    { type: "text", name: "name", placeholder: "Name", icon: User },
    { type: "email", name: "email", placeholder: "Enter E-mail", icon: Mail },
    { type: "password", name: "password", placeholder: "Enter Password", icon: Lock }
  ];

  const signInInputs = [
    { type: "email", name: "email", placeholder: "Enter E-mail", icon: Mail },
    { type: "password", name: "password", placeholder: "Password", icon: Lock }
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