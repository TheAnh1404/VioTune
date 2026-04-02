import React from 'react';
import styles from './Login.module.css';
import { Mail } from 'lucide-react';

const AuthForm = ({ type, title, subtitle, inputs, buttonText, showForgot, onSubmit }) => {
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

        {showForgot && <a href="#" className={styles.forgot}>Forgot Password?</a>}
        
        <button type="submit" className={styles.authButton}>{buttonText}</button>
      </form>
    </div>
  );
};

export default AuthForm;
