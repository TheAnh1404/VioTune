import React from 'react';
import styles from './Onboarding.module.css';
import Logo from '../Logo/Logo';

const Onboarding = () => {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow} />
      
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>
        
        <h1 className={styles.title}>
          Vio<span className={styles.boldText}>Tune</span>
        </h1>
      </div>
    </div>
  );
};

export default Onboarding;
