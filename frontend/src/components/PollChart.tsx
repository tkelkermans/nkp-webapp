'use client';

import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { Poll } from '@/types';
import { getChartColors, calculatePercentage } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface PollChartProps {
  poll: Poll;
  type?: 'bar' | 'doughnut';
  showPercentage?: boolean;
  animate?: boolean;
}

export function PollChart({ poll, type = 'bar', showPercentage = true, animate = true }: PollChartProps) {
  const { options, totalVotes } = poll;
  const colors = useMemo(() => getChartColors(options.length), [options.length]);

  const chartData = useMemo(() => ({
    labels: options.map((opt) => opt.text),
    datasets: [{
      label: 'Votes',
      data: options.map((opt) => opt.votes),
      backgroundColor: colors.map((c) => `${c}CC`),
      borderColor: colors,
      borderWidth: 2,
      borderRadius: type === 'bar' ? 8 : 0,
    }],
  }), [options, colors, type]);

  // Helper function for tooltip label
  const formatTooltipLabel = (value: number): string => {
    const percentage = calculatePercentage(value, totalVotes);
    return showPercentage 
      ? `${value} vote${value !== 1 ? 's' : ''} (${percentage}%)` 
      : `${value} vote${value !== 1 ? 's' : ''}`;
  };

  const barOptions: ChartOptions<'bar'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    animation: animate ? { duration: 500, easing: 'easeOutQuart' } : false,
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
      y: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => formatTooltipLabel(context.raw as number),
        },
      },
    },
  }), [animate, totalVotes, showPercentage]);

  const doughnutOptions: ChartOptions<'doughnut'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    animation: animate ? { duration: 500, easing: 'easeOutQuart' } : false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => formatTooltipLabel(context.raw as number),
        },
      },
    },
  }), [animate, totalVotes, showPercentage]);

  return (
    <div className="w-full" role="img" aria-label={`Graphique des résultats`}>
      <div className="sr-only">
        <h3>Résultats: {poll.question}</h3>
        <ul>
          {options.map((option) => (
            <li key={option.id}>{option.text}: {option.votes} votes ({calculatePercentage(option.votes, totalVotes)}%)</li>
          ))}
        </ul>
      </div>

      <div className="h-64 md:h-80">
        {type === 'bar' ? (
          <Bar data={chartData} options={barOptions} />
        ) : (
          <Doughnut data={chartData} options={doughnutOptions} />
        )}
      </div>

      {showPercentage && type === 'bar' && (
        <div className="mt-4 space-y-2">
          {options.map((option, index) => {
            const percentage = calculatePercentage(option.votes, totalVotes);
            return (
              <div key={option.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                  <span className="font-medium">{option.text}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                  <span className="font-semibold text-gray-900">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PollChart;
