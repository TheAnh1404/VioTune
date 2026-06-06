import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Music, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import styles from './InfoPages.module.css';
import Header from '../../components/Header/Header';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Footer from '../../components/Footer/Footer';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';

const AboutPage = () => {
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
              <h1 className="gradient-text-purple-cyan">Về VioTune</h1>
              <p>Hệ sinh thái âm nhạc AI cao cấp, nơi công nghệ hội ngộ cùng cảm xúc.</p>
            </header>

            <div className={`${styles.infoCard} glass-panel`}>
              <h2>Sứ mệnh của chúng tôi</h2>
              <p>
                VioTune ra đời với mong muốn định nghĩa lại cách con người khám phá âm nhạc. Chúng tôi tin rằng âm nhạc không chỉ là những tệp âm thanh, mà là những trải nghiệm cá nhân hóa sâu sắc.
              </p>
              <p>
                Bằng cách kết hợp các thuật toán học máy tiên tiến như SVD Matrix Factorization và KNN Content Analysis, VioTune mang đến những gợi ý chính xác, giúp bạn tìm thấy "giai điệu định mệnh" của mình giữa hàng triệu bài hát.
              </p>
            </div>

            <div className={styles.contactGrid}>
              <div className={`${styles.contactMethod} glass-panel`}>
                <div className={styles.iconCircle}>
                  <Music size={28} />
                </div>
                <h3>Kho nhạc khổng lồ</h3>
                <p>Hàng triệu bài hát từ các nghệ sĩ hàng đầu thế giới thông qua Deezer API.</p>
              </div>

              <div className={`${styles.contactMethod} glass-panel`}>
                <div className={styles.iconCircle}>
                  <Zap size={28} />
                </div>
                <h3>AI Gợi ý thông minh</h3>
                <p>Hệ thống Hybrid Recommendation tối ưu hóa theo gu âm nhạc thời gian thực.</p>
              </div>

              <div className={`${styles.contactMethod} glass-panel`}>
                <div className={styles.iconCircle}>
                  <ShieldCheck size={28} />
                </div>
                <h3>Bảo mật tuyệt đối</h3>
                <p>Dữ liệu cá nhân và thư viện âm nhạc được bảo vệ bởi Firebase & Google Cloud.</p>
              </div>
            </div>

            <div className={`${styles.infoCard} glass-panel`} style={{ marginTop: '40px' }}>
              <h2>Đội ngũ phát triển</h2>
              <p>
                VioTune được xây dựng bởi những kỹ sư đam mê âm nhạc và công nghệ. Chúng tôi không ngừng nỗ lực để mang đến một nền tảng mượt mà, trực quan và đầy cảm hứng cho người dùng trên khắp thế giới.
              </p>
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

export default AboutPage;
