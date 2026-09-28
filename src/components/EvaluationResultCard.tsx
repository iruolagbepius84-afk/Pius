import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  FileCheck2,
} from 'lucide-react';
import { FraudEvaluationResult } from '../types/fraud';

interface EvaluationResultCardProps {
  result: FraudEvaluationResult;
  onClose?: () => void;
  onViewDetails?: (result: FraudEvaluationResult) => void;
}

export const EvaluationResultCard: React.FC<EvaluationResultCardProps> = ({
  result,
  onClose,
  onViewDetails,
}) => {
  const isFlagged = result.flagged;
  const isCritical = result.risk_level === 'Critical';
  const isHigh = result.risk_level === 'High';
  const isMedium = result.risk_level === 'Medium';

  const levelColor = isCritical
    ? 'text-rose-400 bg-rose-950/80 border-rose-800'
    : isHigh
    ? 'text-orange-400 bg-orange-950/80 border-orange-800'
    : isMedium
    ? 'text-amber-400 bg-amber-950/80 border-amber-800'
    : 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

  const borderTheme = isFlagged
    ? 'border-rose-700/80 bg-slate-900/95'
    : 'border-emerald-700/80 bg-slate-900/95';

  const amountRatio =
    result.CustomerAverageAmountCAD > 0
      ? (result.AmountCAD / result.CustomerAverageAmountCAD).toFixed(1)
      : '1.0';

  return (
    <div className={`rounded-xl border ${borderTheme} p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-300`}>
      {/* Top Banner & Close */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
              isFlagged
                ? 'bg-rose-950/90 border-rose-800 text-rose-400'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-400'
            }`}
          >
            {isFlagged ? (
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border uppercase tracking-wider ${levelColor}`}>
                {result.risk_level} Risk
              </span>
              <span className="text-xs font-mono text-slate-400">
                Score: <strong className="text-white text-sm tabular-nums">{result.risk_score}</strong>/100
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {result.alert_status === 'FLAGGED_FOR_REVIEW'
                ? 'Transaction Flagged For Fraud Review'
                : result.alert_status === 'CLEARED_BY_RULE_ENGINE'
                ? 'Cleared by Fraud Rule Engine'
                : result.alert_status}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(result)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <span>Full Audit</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close banner"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-800/80">
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400">Transaction Amount</span>
          <p className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
            ${result.AmountCAD.toLocaleString('en-CA', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">CAD</span>
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Customer Avg: ${result.CustomerAverageAmountCAD} ({amountRatio}x)
          </span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400">Risk Factors Found</span>
          <p className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
            {result.risk_factor_count || result.risk_factors.length} <span className="text-xs font-normal text-slate-400">triggers</span>
          </p>
          <span className="text-[10px] text-slate-500">
            {result.investigation_required ? 'Investigation required' : 'Standard auto-clear'}
          </span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400">Telemetry Indicators</span>
          <p className="text-xs font-mono text-slate-200 mt-1 space-y-0.5">
            <span>IP: <strong className={result.IPRiskScore > 70 ? 'text-rose-400' : 'text-slate-300'}>{result.IPRiskScore}/100</strong></span> · 
            <span className="ml-1">Merc: <strong className={result.MerchantRiskScore > 70 ? 'text-rose-400' : 'text-slate-300'}>{result.MerchantRiskScore}/100</strong></span>
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            {result.TransactionsLast10Min} txns / 10m · {result.FailedAttemptsLast24H} fails
          </span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400">Evaluated Timestamp</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono mt-1">
            <Clock className="h-3 w-3 text-slate-500" />
            <span className="truncate">{new Date(result.evaluated_at).toLocaleTimeString()}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate block">
            {new Date(result.evaluated_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Risk Factors List */}
      <div className="py-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>Risk Factors Evaluated ({result.risk_factors.length})</span>
        </h4>

        {result.risk_factors.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>No anomalous risk factors were triggered for this transaction. Rule engine cleared without manual intervention.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.risk_factors.map((factor, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-200"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span className="leading-snug">{factor}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Explanation & Recommendations (from webhook) */}
      {(result.ai_explanation || (result.ai_recommended_next_steps && result.ai_recommended_next_steps.length > 0)) && (
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          {result.ai_explanation && result.ai_explanation !== 'AI explanation unavailable.' && (
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>AI Risk Assessment Synthesis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.ai_explanation}
              </p>
            </div>
          )}

          {result.ai_recommended_next_steps && result.ai_recommended_next_steps.length > 0 && (
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-amber-400" />
                <span>Recommended Next Steps</span>
              </div>
              <ul className="space-y-1.5">
                {result.ai_recommended_next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <ArrowRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
