import React from 'react';// React kütüphanesini import ettik
import { Line } from 'react-chartjs-2';// Chart.js'in React wrapper'ını import ettik
import {
  Chart as ChartJS,// Chart.js'in temel modülünü import ettik
  CategoryScale,// Kategorik ölçek modülünü import ettik
  LinearScale,// Lineer ölçek modülünü import ettik
  PointElement,// Nokta elemanı modülünü import ettik
  LineElement,// Çizgi elemanı modülünü import ettik
  Title,// Başlık modülünü import ettik
  Tooltip,// Araç ipucu modülünü import ettik
  Legend,// Lejant modülünü import ettik
  Filler// Dolgu modülünü import ettik
} from 'chart.js';// Chart.js'in farklı bileşenlerini import ettik
import { useLanguage } from '../context/LanguageContext';// YENİ: Türkçe dil desteği

// Chart.js'i kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProgressChart({ workoutHistory }) {//son 7 günün antrenman geçmişini alır ve bir çizgi grafiği olarak gösterir
  const { t } = useLanguage();

  // Son 7 günün verilerini hazırla
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    // NOT: dayKey İngilizce sabit kalıyor (iç veri anahtarı), dayName ise
    // t('progressChart.days.X') ile ekranda çevrilen etiket.
    const dayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = dayKeys[date.getDay()];
      days.push({
        date: date.toISOString().split('T')[0],
        dayKey,
        dayName: t(`progressChart.days.${dayKey}`),
        workouts: 0,
        calories: 0,
        duration: 0
      });
    }
    
    return days;
  };

  const processData = () => {// Antrenman geçmişini son 7 günün verileriyle birleştirir
    const days = getLast7Days();
    
    // Workout history'den verileri ekle
    workoutHistory.forEach(workout => {
      const workoutDate = workout.timestamp?.split('T')[0] || workout.date;
      const dayIndex = days.findIndex(d => d.date === workoutDate);
      
      if (dayIndex !== -1) {// Eğer antrenman tarihi son 7 gün içinde ise, ilgili güne verileri ekle
        days[dayIndex].workouts += 1;// Antrenman sayısını artırır
        days[dayIndex].calories += workout.calories || 0;// Kalori miktarını artırır
        days[dayIndex].duration += workout.duration || 0;// Antrenman süresini artırır
      }
    });
    
    return days;
  };

  const chartData = processData();// Son 7 günün verilerini hazırlar ve chartData değişkenine atar

  const data = {
    labels: chartData.map(d => d.dayName),// X eksenindeki etiketler, gün isimleri
    datasets: [
      {
        label: t('progressChart.caloriesBurned'),
        data: chartData.map(d => d.calories),
        borderColor: 'rgb(6, 182, 212)', 
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(6, 182, 212)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: t('progressChart.workouts'),
        data: chartData.map(d => d.workouts),
        borderColor: 'rgb(139, 92, 246)', 
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8', 
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '600'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
        titleColor: '#06b6d4', 
        bodyColor: '#e2e8f0', 
        borderColor: '#334155', 
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                label += context.parsed.y + ' ' + t('leaderboard.kcal');
              } else {
                label += context.parsed.y + ' ' + t('progressChart.workoutsUnit');
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8', 
          font: {
            size: 11,
            weight: '500'
          }
        },
        border: {
          color: '#334155' 
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(51, 65, 85, 0.3)', 
          drawBorder: false,
        },
        ticks: {
          color: '#06b6d4', 
          font: {
            size: 11,
            weight: '600'
          },
          callback: function(value) {
            return value + ' ' + t('leaderboard.kcal');
          }
        },
        border: {
          display: false
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#8b5cf6', 
          font: {
            size: 11,
            weight: '600'
          },
          stepSize: 1,
          callback: function(value) {
            return value;
          }
        },
        border: {
          display: false
        }
      }
    }
  };

  // İstatistikler
  const totalCalories = chartData.reduce((sum, d) => sum + d.calories, 0);// Toplam kalori miktarını hesaplar
  const totalWorkouts = chartData.reduce((sum, d) => sum + d.workouts, 0);// Toplam antrenman sayısını hesaplar
  const avgCaloriesPerDay = Math.round(totalCalories / 7);// Günlük ortalama kalori miktarını hesaplar
  const mostActiveDay = chartData.reduce((max, d) => d.workouts > max.workouts ? d : max, chartData[0]);// En aktif günü bulur

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-80 relative">
        <Line data={data} options={options} />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/30">
          <p className="text-cyan-400 text-xs mb-1">{t('progressChart.totalCalories')}</p>
          <p className="text-2xl font-black text-white">{totalCalories}</p>
          <p className="text-slate-500 text-xs">{t('progressChart.kcalPerWeek')}</p>
        </div>

        <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/30">
          <p className="text-violet-400 text-xs mb-1">{t('progressChart.workouts')}</p>
          <p className="text-2xl font-black text-white">{totalWorkouts}</p>
          <p className="text-slate-500 text-xs">{t('progressChart.total')}</p>
        </div>

        <div className="p-4 rounded-xl bg-green-950/30 border border-green-800/30">
          <p className="text-green-400 text-xs mb-1">{t('progressChart.dailyAvg')}</p>
          <p className="text-2xl font-black text-white">{avgCaloriesPerDay}</p>
          <p className="text-slate-500 text-xs">{t('progressChart.kcalPerDay')}</p>
        </div>

        <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-800/30">
          <p className="text-orange-400 text-xs mb-1">{t('progressChart.mostActiveDay')}</p>
          <p className="text-2xl font-black text-white">{mostActiveDay.dayName}</p>
          <p className="text-slate-500 text-xs">{mostActiveDay.workouts} {t('progressChart.workoutsUnit')}</p>
        </div>
      </div>
    </div>
  );
}
