import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import styles from './InfoPages.module.css';
import Header from '../../components/Header/Header';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Footer from '../../components/Footer/Footer';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';

const FAQPage = () => {
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

  const faqs = [
    {
      q: "VioTune có miễn phí không?",
      a: "VioTune hiện đang cung cấp trải nghiệm hoàn toàn miễn phí cho tất cả người dùng, bao gồm cả các tính năng gợi ý AI cao cấp."
    },
    {
      q: "Làm thế nào để hệ thống AI hiểu gu âm nhạc của tôi?",
      a: "Hệ thống AI của chúng tôi phân tích các bài hát bạn đã 'Thích' (Like) và lịch sử nghe nhạc của bạn để xây dựng Acoustic DNA. Càng tương tác nhiều, gợi ý sẽ càng chính xác."
    },
    {
      q: "Tôi có thể nghe nhạc ngoại tuyến (Offline) không?",
      a: "Hiện tại VioTune hỗ trợ nghe trực tuyến thông qua bản xem trước từ Deezer. Tính năng tải về ngoại tuyến đang được nghiên cứu cho các phiên bản tương lai."
    },
    {
      q: "Tôi là nghệ sĩ, làm sao để đưa nhạc lên VioTune?",
      a: "VioTune lấy dữ liệu từ hệ sinh thái Deezer. Bạn chỉ cần phân phối nhạc qua các đối tác của Deezer, nhạc của bạn sẽ tự động xuất hiện trên hệ thống của chúng tôi."
    },
    {
      q: "Làm thế nào để thay đổi thông tin cá nhân?",
      a: "Bạn có thể quản lý hồ sơ của mình trong phần cài đặt tài khoản (sắp ra mắt) hoặc liên hệ với bộ phận hỗ trợ nếu cần thay đổi email/tên hiển thị."
    }
  ];

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
              <h1 className="gradient-text-purple-cyan">Câu hỏi thường gặp</h1>
              <p>Tìm câu trả lời nhanh cho những thắc mắc phổ biến nhất về VioTune.</p>
            </header>

            <div className={`${styles.infoCard} glass-panel`}>
              <div className={styles.iconCircle} style={{ marginBottom: '24px' }}>
                <HelpCircle size={32} />
              </div>
              
              {faqs.map((faq, index) => (
                <div key={index} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{faq.q}</h3>
                  <p className={styles.faqAnswer}>{faq.a}</p>
                </div>
              ))}
            </div>

            <div className={`${styles.infoCard} glass-panel`} style={{ textAlign: 'center' }}>
              <h2>Vẫn còn thắc mắc?</h2>
              <p>Nếu bạn không tìm thấy câu trả lời mình cần, hãy liên hệ trực tiếp với chúng tôi qua trang Liên hệ.</p>
              <button 
                className={styles.backBtn} 
                style={{ margin: '16px 0 0', display: 'inline-flex' }}
                onClick={() => navigate('/contact')}
              >
                Đến trang Liên hệ
              </button>
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

export default FAQPage;
