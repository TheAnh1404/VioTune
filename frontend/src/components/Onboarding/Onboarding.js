import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Onboarding.module.css';
import logo from '../../assets/logo.png';

const Onboarding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Tự động chuyển trang sau 3 giây
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.container}>
      {/* Lớp nền tạo hiệu ứng gợn sóng mờ */}
      <div className={styles.backgroundGlow} />
      
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <img 
            src={logo} 
            alt="VioTune Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />
        </div>
        
        <h1 className={styles.title}>
          Vio<span className={styles.boldText}>Tune</span>
        </h1>
      </div>
    </div>
  );
};

export default Onboarding;