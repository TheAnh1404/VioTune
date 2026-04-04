import React from 'react';
import styles from './Footer.module.css';
import logoIcon from '../../assets/logo.png'; // File logo không chữ của bạn

const Footer = () => {
  return (
    <footer className={styles.footerContainer}>
      <div className={styles.topSection}>
        {/* Brand Column */}
        <div className={styles.brandInfo}>
          <div className={styles.logoWrapper}>
            <img src={logoIcon} alt="Logo" className={styles.logoImg} />
            <span className={styles.brandName}>VioTune</span>
          </div>
          <h3 className={styles.welcomeText}>Welcome To VioTune!</h3>
          <p className={styles.description}>
            At Echo Stream, We Are Passionate About Bringing Music Closer To You.
          </p>
        </div>

        {/* Links Columns */}
        <div className={styles.linksGrid}>
          <div className={styles.linkColumn}>
            <h4>Main Links</h4>
            <ul>
              <li>About Us</li>
              <li>Contact Us</li>
              <li>FAQ</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div className={styles.linkColumn}>
            <h4>Categories</h4>
            <ul>
              <li>Music Genre</li>
              <li>Popular Playlists</li>
              <li>New Albums</li>
            </ul>
          </div>
          <div className={styles.linkColumn}>
            <h4>Main Links</h4>
            <ul>
              <li>About Us</li>
              <li>Contact Us</li>
              <li>FAQ</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.bottomSection}>
        <div className={styles.newsletter}>
          <p>Enter your email to receive the latest news.</p>
          <div className={styles.inputWrapper}>
            <div className={styles.inputWithIcon}>
              <svg className={styles.mailIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                type="email" 
                placeholder="Example@gmail.com" 
                className={styles.emailInput} 
              />
            </div>
            <button className={styles.subscribeBtn}>Subscribe</button>
          </div>
        </div>

        <div className={styles.socialWrapper}>
          <span className={styles.followUsText}>Follow Us</span>
          <div className={styles.socialIcons}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="FB" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg" alt="TW" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="IG" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;