'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PieChartProps {
  data: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  title?: string;
}

export function PieChart({ data, title }: PieChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.colors,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: '#ffffff',
          font: {
            size: 13,
            family: "'Inter', sans-serif",
          },
          boxWidth: 14,
          boxHeight: 14,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = typeof context.parsed === 'number' ? context.parsed : 0;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + (typeof b === 'number' ? b : 0), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#ffffff',
        font: {
          size: 12,
          weight: 'bold',
        },
        formatter: (value, context) => {
          const numValue = typeof value === 'number' ? value : 0;
          const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + (typeof b === 'number' ? b : 0), 0);
          const percentage = total > 0 ? ((numValue / total) * 100).toFixed(1) : '0';
          return `${percentage}%`;
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      {title && (
        <h3 className="text-center text-lg font-semibold mb-4 text-white">{title}</h3>
      )}
      <Pie data={chartData} options={options} />
    </div>
  );
}

