import React, { useState } from 'react';
import styles from './SideBarMenu.module.css';
import { 
  Home, Heart, ListMusic, Globe, 
  Award, MessageSquare 
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, expanded, onClick }) => {
  // Determine CSS classes based on active and expanded state
  let itemClass = styles.menuItem;
  let iconClass = styles.iconInactive;
  
  if (active) {
    if (expanded) {
      itemClass = `${styles.menuItem} ${styles.activeExpanded}`;
      iconClass = styles.iconActiveExpanded;
    } else {
      itemClass = `${styles.menuItem} ${styles.activeCollapsed}`;
      iconClass = styles.iconActiveCollapsed;
    }
  }

  return (
    <div 
      className={itemClass} 
      onClick={onClick}
      title={expanded ? undefined : label}
    >
      <div className={styles.iconWrapper}>
        <Icon 
          size={22} 
          strokeWidth={active ? 2.5 : 1.5} 
          className={iconClass}
        />
      </div>
      <span className={`${styles.label} ${expanded ? styles.labelExpanded : styles.labelCollapsed}`}>
        {label}
      </span>
    </div>
  );
};

const SideBarMenu = () => {
  const [activeTab, setActiveTab] = useState('Home');
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'Favorite', label: 'Favorite', icon: Heart },
    { id: 'Playlists', label: 'Playlists', icon: ListMusic },
    { id: 'Browser', label: 'Browser', icon: Globe },
  ];

  const bottomItems = [
    { id: 'Premium', label: 'Permium', icon: Award },
    { id: 'Q&A', label: 'Q&A', icon: MessageSquare },
  ];

  return (
    <aside 
      className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* The main pill-shaped container */}
      <div className={`${styles.pillContainer} ${isExpanded ? styles.pillExpanded : styles.pillCollapsed}`}>
        {/* Main Menu */}
        <nav className={styles.menuGroup}>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              expanded={isExpanded}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        {/* Bottom Menu */}
        <div className={styles.bottomGroup}>
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              expanded={isExpanded}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SideBarMenu;