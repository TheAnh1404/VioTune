import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MapPin, Phone, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import styles from './InfoPages.module.css';
import Header from '../../components/Header/Header';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Footer from '../../components/Footer/Footer';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';

const ContactPage = () => {
  const navigate = useNavigate();
  const { user, logOut, likedSongs, likedSongIds } = useAuth();
  const { currentSong, isPlaying, togglePlay, duration, currentTime, seek, nextSong, prevSong, repeatMode, isShuffle, toggleRepeat, toggleShuffle, volume, setVolume, previewLoading, previewUrl, audioElement, playSong } = usePlayback();
  const username = user?.displayName || user?.email?.split('@')[0] || "User";
  const userId = user?.uid;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogOut = async () => {
    try {
      await logOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handlePlaySong = (song, songList = []) => {
    playSong(song, songList);
    navigate('/player');
  };

  return (
    <div className={styles.infoContainer}>
      <div className={styles.ambientGlow} />
      
      <Header 
        username={username} 
        onLogOut={handleLogOut}
        showSearch={false}
      />

      <div className={styles.layoutWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongs}
          likedSongIds={likedSongIds}
          refreshTrigger={likedSongs?.length || 0}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
        />

        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <header className={styles.pageHeader}>
              <h1 className="gradient-text-purple-cyan">Liên hệ với chúng tôi</h1>
              <p>Chúng tôi luôn lắng nghe ý kiến đóng góp và sẵn sàng hỗ trợ bạn 24/7.</p>
            </header>

            <div className={styles.contactGrid}>
              <div className={`${styles.contactMethod} glass-panel`}>
                <div className={styles.iconCircle}>
                  <Mail size={28} />
                </div>
                <h3>Email</h3>
                <p>support@viotune.com</p>
                <p>press@viotune.com</p>
              </div>

              <div className={`${styles.contactMethod} glass-panel`}>
                <div className={styles.iconCircle}>
                  <Phone size={28} />
                </div>
                <h3>Điện thoại</h3>
                <p>+84 (0) 123 456 789</p>
                <p>+84 (0) 987 654 321</p>
              </div>

              <div className={`${styles.contactMethod} glass-panel`}>
                <div className={styles.iconCircle}>
                  <MapPin size={28} />
                </div>
                <h3>Địa chỉ</h3>
                <p>Tòa nhà VioTune, Quận 1</p>
                <p>Thành phố Hồ Chí Minh, Việt Nam</p>
              </div>
            </div>

            <div className={`${styles.infoCard} glass-panel`} style={{ marginTop: '40px' }}>
              <h2>Gửi tin nhắn cho chúng tôi</h2>
              <p>
                Nếu bạn có bất kỳ câu hỏi nào về bản quyền, hợp tác nghệ sĩ hoặc hỗ trợ kỹ thuật, đừng ngần ngại gửi email. Đội ngũ của chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
              </p>
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <div className={styles.iconCircle} style={{ margin: '0 auto 16px' }}>
                  <Globe size={28} />
                </div>
                <p style={{ color: 'var(--accent-secondary)', fontWeight: 'var(--weight-bold)' }}>www.viotune.com</p>
              </div>
            </div>
            
            <Footer />
          </div>
        </main>
      </div>

      <MusicPlayer 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onTogglePlay={togglePlay} 
        duration={duration}
        currentTime={currentTime}
        onSeek={seek}
        onNext={nextSong}
        onPrev={prevSong}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={toggleShuffle}
        volume={volume}
        onVolumeChange={setVolume}
        previewLoading={previewLoading}
        previewUrl={previewUrl}
        onMaximize={() => navigate('/player')}
        audioElement={audioElement}
      />
    </div>
  );
};

export default ContactPage;
