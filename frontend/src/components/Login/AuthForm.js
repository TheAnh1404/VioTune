import React from 'react';
import styles from './Login.module.css';
import { Mail } from 'lucide-react';

const AuthForm = ({ type, title, subtitle, inputs, buttonText, showForgot, onForgotClick, onSubmit, error, children }) => {
  const isLoading = buttonText && (buttonText.includes('...'));
  return (
    <div className={`${styles.formContainer} ${type === 'signup' ? styles.signUp : styles.signIn}`}>
      <form className={styles.form} onSubmit={onSubmit}>
        <h1 className={styles.title}>{title}</h1>
        
        <div className={styles.socialIcons}>
          <a href="#" className={styles.icons}><img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width="20" alt="Google" /></a>
          <a href="#" className={styles.icons}><img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" width="20" alt="Facebook" /></a>
          <a href="#" className={styles.icons}><Mail size={20} color="white" /></a>
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
            fontSize: '13px',
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

