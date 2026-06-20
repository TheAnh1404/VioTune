import React from 'react';
import styles from './Login.module.css';
import { Mail } from 'lucide-react';

const AuthForm = ({ type, title, subtitle, inputs, buttonText, showForgot, onForgotClick, onSubmit, error, onGoogleClick, onFacebookClick, children }) => {
  const isLoading = buttonText && (buttonText.includes('...'));
  return (
    <div className={`${styles.formContainer} ${type === 'signup' ? styles.signUp : styles.signIn}`}>
      <form className={styles.form} onSubmit={onSubmit}>
        <h1 className={styles.title}>{title}</h1>
        
        <div className={styles.socialIcons}>
          <button type="button" onClick={onGoogleClick} className={styles.icons} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 'none' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="20" alt="Google" />
          </button>
          <button type="button" onClick={onFacebookClick} className={styles.icons} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', outline: 'none' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" width="20" alt="Facebook" />
          </button>
          <button type="button" aria-label="Email sign in" className={styles.icons} style={{ background: 'none', border: 'none' }}>
            <Mail size={20} color="white" />
          </button>
        </div>
        
        <span className={styles.span}>{subtitle}</span>

        {inputs.map((input, index) => {
          const Icon = input.icon;
          return (
            <div className={styles.inputGroup} key={index}>
              {Icon && <Icon size={18} className={styles.inputIcon} />}
              <input 
                type={input.type} 
                name={input.name} 
                placeholder={input.placeholder} 
                onChange={input.onChange} 
                value={input.value} 
                required={input.required}
              />
            </div>
          );
        })}

        {error && (
          <div style={{
            color: '#ff6b6b',
            fontSize: 'var(--text-label)',
            padding: '8px 12px',
            background: 'rgba(255,107,107,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255,107,107,0.3)',
            marginBottom: '8px',
            textAlign: 'center',
            width: '100%'
          }}>
            {error}
          </div>
        )}

        {showForgot && (
          <button 
            type="button" 
            onClick={onForgotClick} 
            className={styles.forgot}
            style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
          >
            Forgot Password?
          </button>
        )}
        
        {children}
        
        <button type="submit" className={styles.authButton} disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}>
          {buttonText}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;

