import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';

/**
 * AcousticDNARadar Component
 * Visualizes song features (danceability, energy, etc.) in a premium Radar Chart.
 * 
 * @param {Object} data - Object containing acoustic features (0.0 to 1.0)
 */
const AcousticDNARadar = ({ data }) => {
  if (!data) return null;

  // Transform flat object into Recharts-friendly array
  const chartData = [
    { subject: 'Nhịp điệu', A: data.danceability || 0.5, fullMark: 1.0 },
    { subject: 'Năng lượng', A: data.energy || 0.5, fullMark: 1.0 },
    { subject: 'Cảm xúc', A: data.valence || 0.5, fullMark: 1.0 },
    { subject: 'Nhạc cụ', A: data.acousticness || 0.5, fullMark: 1.0 },
    { subject: 'Liveness', A: data.liveness || 0.2, fullMark: 1.0 },
    { subject: 'Giọng hát', A: data.speechiness || 0.1, fullMark: 1.0 },
  ];

  return (
    <div style={{ width: '100%', height: '240px', marginTop: '10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 1.0]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Acoustic DNA"
            dataKey="A"
            stroke="var(--accent-primary)"
            fill="var(--accent-primary)"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AcousticDNARadar;
