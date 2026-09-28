import React, { useState } from 'react';
import { PieChart as PieIcon, BarChart3, AlertOctagon, TrendingUp } from 'lucide-react';
import { FraudEvaluationResult, RiskLevel } from '../types/fraud';

interface RiskChartsProps {
  transactions: FraudEvaluationResult[];
  onSelectLevelFilter?: (level: RiskLevel | null) => void;
  activeLevelFilter?: RiskLevel | null;
}

export const RiskCharts: React.FC<RiskChartsProps> = ({
  transactions,
  onSelectLevelFilter,
  activeLevelFilter,
}) => {
  const [chartView, setChartView] = useState<'donut' | 'bar'>('donut');

  // Compute counts for Risk Levels
  const riskLevels: { level: RiskLevel; count: number; color: string; bg: string; border: string }[] = [
    { level: 'Critical', count: 0, color: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500' },
    { level: 'High', count: 0, color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500' },
    { level: 'Medium', count: 0, color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500' },
    { level: 'Low', count: 0, color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500' },
  ];

  transactions.forEach((t) => {
    const matched = riskLevels.find((r) => r.level.toLowerCase() === (t.risk_level || '').toLowerCase());
    if (matched) {
      matched.count++;
    } else {
      // fallback
      riskLevels[3].count++;
    }
  });

  const totalTxns = transactions.length || 1;

  // Compute frequent risk factors across all flagged transactions
  const flaggedTxns = transactions.filter((t) => t.flagged);
  const factorMap: { [factor: string]: number } = {};

  flaggedTxns.forEach((t) => {
    if (Array.isArray(t.risk_factors)) {
      t.risk_factors.forEach((f) => {
        if (!f) return;
        factorMap[f] = (factorMap[f] || 0) + 1;
      });
    }
  });

  const sortedFactors = Object.entries(factorMap)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // top 8 factors

  // Compute Donut SVG segments
  let cumulativeAngle = 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  const donutSegments = riskLevels.map((item) => {
    const ratio = item.count / totalTxns;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle;
    cumulativeAngle += ratio * circumference;
    return {
      ...item,
      ratio,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const hexColors: { [key in RiskLevel]: string } = {
    Critical: '#f43f5e',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#10b981',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chart 1: Risk Level Distribution */}
      <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Risk Level Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Classification across all {transactions.length} evaluations</p>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-md">
              <button
                type="button"
                onClick={() => setChartView('donut')}
                className={`p-1 rounded text-xs transition-colors ${
                  chartView === 'donut' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Donut View"
              >
                <PieIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartView('bar')}
                className={`p-1 rounded text-xs transition-colors ${
                  chartView === 'bar' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bar View"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-500">
              No transactions recorded yet
            </div>
          ) : chartView === 'donut' ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              {/* Donut graphic */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="20"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.level}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={hexColors[seg.level]}
                      strokeWidth="20"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="butt"
                      className="transition-all duration-700 ease-out hover:opacity-80 cursor-pointer"
                      onClick={() => onSelectLevelFilter?.(activeLevelFilter === seg.level ? null : seg.level)}
                    />
                  ))}
                </svg>
                {/* Center text */}
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-bold text-white font-mono tabular-nums">
                    {transactions.length}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend with interactive filters */}
              <div className="flex flex-col gap-2 w-full sm:w-auto min-w-[140px]">
                {riskLevels.map((item) => {
                  const pct = totalTxns > 0 ? ((item.count / totalTxns) * 100).toFixed(0) : '0';
                  const isSelected = activeLevelFilter === item.level;
                  return (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => onSelectLevelFilter?.(isSelected ? null : item.level)}
                      className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-slate-500 bg-slate-800 text-white font-semibold'
                          : 'border-transparent hover:border-slate-700/80 bg-slate-900/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.bg}`} />
                        <span>{item.level}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400">
                        <span className="text-white font-medium">{item.count}</span>
                        <span className="text-[11px] text-slate-500">({pct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Bar view */
            <div className="space-y-3 py-2">
              {riskLevels.map((item) => {
                const pct = totalTxns > 0 ? ((item.count / totalTxns) * 100).toFixed(1) : '0';
                const isSelected = activeLevelFilter === item.level;
                return (
                  <div
                    key={item.level}
                    onClick={() => onSelectLevelFilter?.(isSelected ? null : item.level)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium text-slate-200">{item.level} Risk</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.bg} transition-all duration-500`}
                        style={{ width: `${Math.max(item.count > 0 ? 4 : 0, Number(pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activeLevelFilter && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Filtering table by: <strong className="text-white">{activeLevelFilter}</strong></span>
            <button
              onClick={() => onSelectLevelFilter?.(null)}
              className="text-rose-400 hover:text-rose-300 underline"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>

      {/* Chart 2: Most Frequent Risk Factors Across Flagged Transactions */}
      <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Top Triggered Risk Factors</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Frequency across {flaggedTxns.length} flagged transaction reviews
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded-md">
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>{Object.keys(factorMap).length} distinct indicators</span>
          </div>
        </div>

        {flaggedTxns.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <TrendingUp className="h-8 w-8 text-slate-600 mb-2 opacity-60" />
            <p className="text-xs">No flagged transactions in record yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Submit a high-risk transaction or sample batch to inspect risk factor prevalence.
            </p>
          </div>
        ) : sortedFactors.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-xs text-slate-500">
            No specific risk factor text reported for flagged items.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedFactors.map((item, idx) => {
              const maxCount = sortedFactors[0]?.count || 1;
              const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));
              const pctOfFlagged = ((item.count / flaggedTxns.length) * 100).toFixed(0);

              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium truncate max-w-[70%] sm:max-w-[75%]" title={item.factor}>
                      {item.factor}
                    </span>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400 shrink-0">
                      <span className="text-white font-semibold">{item.count}</span>
                      <span className="text-[11px] text-slate-500">({pctOfFlagged}% of flags)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500 group-hover:brightness-110"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
