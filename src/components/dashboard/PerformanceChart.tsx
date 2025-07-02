import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 차트 옵션
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
};

// 임시 차트 데이터
const generateChartData = () => {
  return {
    labels: ['1주', '2주', '3주', '4주'],
    datasets: [
      {
        label: '출석률',
        data: [65, 78, 80, 85],
        borderColor: 'rgb(45, 85, 255)',
        backgroundColor: 'rgba(45, 85, 255, 0.5)',
        tension: 0.3,
      },
      {
        label: '신규 등록',
        data: [12, 15, 20, 18],
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        tension: 0.3,
      },
      {
        label: '매출',
        data: [100, 120, 135, 150],
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.5)',
        tension: 0.3,
      },
    ],
  };
};

// 테마 변경에 따른 차트 스타일 업데이트
const PerformanceChart = () => {
  const [chartData, setChartData] = useState(generateChartData());
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 다크모드 감지
    const isDarkMode = document.documentElement.classList.contains('dark');
    setDarkMode(isDarkMode);

    // 다크모드 변경 감지
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setDarkMode(isDark);
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // 다크모드에 따른 차트 스타일 업데이트
    const updatedOptions = {
      ...options,
      scales: {
        ...options.scales,
        x: {
          ticks: {
            color: darkMode ? '#94a3b8' : '#475569',
          },
          grid: {
            color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.5)',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: darkMode ? '#94a3b8' : '#475569',
          },
          grid: {
            color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.5)',
          },
        },
      },
      plugins: {
        ...options.plugins,
        legend: {
          ...options.plugins.legend,
          labels: {
            color: darkMode ? '#e2e8f0' : '#1e293b',
          },
        },
      },
    };

    // 옵션 업데이트 로직
    ChartJS.defaults.color = darkMode ? '#94a3b8' : '#475569';
    ChartJS.defaults.borderColor = darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.5)';
  }, [darkMode]);

  return (
    <div className="h-60">
      <Line options={options} data={chartData} />
    </div>
  );
};

export default PerformanceChart;