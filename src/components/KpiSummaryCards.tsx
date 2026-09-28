import React from 'react';
import { ShieldAlert, ShieldCheck, Activity, DollarSign, AlertTriangle } from 'lucide-react';
import { FraudEvaluationResult } from '../types/fraud';

interface KpiSummaryCardsProps {
  transactions: FraudEvaluationResult[];
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({ transactions }) => {
  const totalCount = transactions.length;
  const flaggedCount = transactions.filter((t) => t.flagged).length;
  const clearedCount = totalCount - flaggedCount;
  const flaggedRate = totalCount > 0 ? (flaggedCount / totalCount) * 100 : 0;
  
  const totalRiskScoreSum = transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0);
  const avgRiskScore = totalCount > 0 ? Math.round(totalRiskScoreSum / totalCount) : 0;

  const totalVolumeCAD = transactions.reduce((sum, t) => sum + (t.AmountCAD || 0), 0);
  const flaggedVolumeCAD = transactions
    .filter((t) => t.flagged)
    .reduce((sum, t) => sum + (t.AmountCAD || 0), 0);

  // Score tier color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-rose-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Transactions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Evaluated</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            ${totalVolumeCAD.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD vol
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800 flex">
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${flaggedRate}%` }}
            title={`Flagged: ${flaggedRate.toFixed(1)}%`}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${100 - flaggedRate}%` }}
            title={`Cleared: ${(100 - flaggedRate).toFixed(1)}%`}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
          <span>{flaggedCount} flagged</span>
          <span>{clearedCount} cleared</span>
        </div>
      </div>

      {/* 2. Flagged vs Cleared Count */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Flagged For Review</span>
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-900/50 text-rose-400">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-rose-400 font-mono tabular-nums">
            {flaggedCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">
            ({flaggedRate.toFixed(1)}% of total)
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
          <span className="text-rose-400 font-semibold">${flaggedVolumeCAD.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD</span>
          <span>at risk exposure</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Requires fraud analyst triage
        </div>
      </div>

      {/* 3. Cleared By Rule Engine */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Cleared Automatically</span>
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-900/50 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
            {clearedCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">
            ({(100 - flaggedRate).toFixed(1)}% safe)
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums">
          <span className="text-emerald-400 font-semibold">${(totalVolumeCAD - flaggedVolumeCAD).toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD</span>
          <span>settled safely</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Automated rule threshold passed
        </div>
      </div>

      {/* 4. Average Risk Score */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Average Risk Score</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${getScoreColor(avgRiskScore)}`}>
            {avgRiskScore}
          </span>
          <span className="text-xs text-slate-500 font-mono">/ 100</span>
          <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300">
            {avgRiskScore >= 75 ? 'Elevated' : avgRiskScore >= 40 ? 'Moderate' : 'Low Risk'}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              avgRiskScore >= 75 ? 'bg-rose-500' : avgRiskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, avgRiskScore))}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-slate-400 font-mono">
          <span>0 (Min)</span>
          <span>50 (Threshold)</span>
          <span>100 (Max)</span>
        </div>
      </div>
    </div>
  );
};
