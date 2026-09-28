import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  FileCode,
  Clock,
  ExternalLink,
  Laptop,
  MapPin,
  Globe,
  Activity,
  UserCheck,
} from 'lucide-react';
import { FraudEvaluationResult } from '../types/fraud';

interface TransactionDetailModalProps {
  transaction: FraudEvaluationResult | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [viewRawJson, setViewRawJson] = useState<boolean>(false);

  if (!transaction) return null;

  const isFlagged = transaction.flagged;
  const isCritical = transaction.risk_level === 'Critical';
  const isHigh = transaction.risk_level === 'High';
  const isMedium = transaction.risk_level === 'Medium';

  const levelColor = isCritical
    ? 'text-rose-400 bg-rose-950/80 border-rose-800'
    : isHigh
    ? 'text-orange-400 bg-orange-950/80 border-orange-800'
    : isMedium
    ? 'text-amber-400 bg-amber-950/80 border-amber-800'
    : 'text-emerald-400 bg-emerald-950/80 border-emerald-800';

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(transaction, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const amountRatio =
    transaction.CustomerAverageAmountCAD > 0
      ? (transaction.AmountCAD / transaction.CustomerAverageAmountCAD).toFixed(1)
      : '1.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border ${
                isFlagged
                  ? 'bg-rose-950/80 border-rose-900 text-rose-400'
                  : 'bg-emerald-950/80 border-emerald-900 text-emerald-400'
              }`}
            >
              {isFlagged ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white font-mono">
                  {transaction.id}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${levelColor}`}>
                  {transaction.risk_level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated {new Date(transaction.evaluated_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewRawJson(!viewRawJson)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>{viewRawJson ? 'View Summary' : 'Raw JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {viewRawJson ? (
            <div className="relative">
              <button
                onClick={copyJson}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(transaction, null, 2)}
              </pre>
            </div>
          ) : (
            <>
              {/* Primary Score Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isFlagged
                    ? 'border-rose-800/80 bg-rose-950/30'
                    : 'border-emerald-800/80 bg-emerald-950/30'
                }`}
              >
                <div>
                  <div className="text-xs text-slate-400">Rule Engine Verdict</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {transaction.alert_status}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {transaction.investigation_required
                      ? 'Investigation Required: Triggered high risk heuristic thresholds.'
                      : 'Rule Engine Cleared: Normal operational tolerance.'}
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                  <div>
                    <div className="text-[11px] text-slate-400">Risk Score</div>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {transaction.risk_score}
                      <span className="text-xs font-normal text-slate-400 font-sans">/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Risk Factors</div>
                    <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                      {transaction.risk_factor_count || transaction.risk_factors.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* 10 Inputs Detail Breakdown Grid */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Transaction Telemetry (10 Input Signals)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">Amount (CAD)</span>
                    <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                      ${transaction.AmountCAD.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Avg: ${transaction.CustomerAverageAmountCAD} ({amountRatio}x)
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">Account Age</span>
                    <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                      {transaction.AccountAgeDays} days
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {transaction.AccountAgeDays < 30 ? 'New Account Risk' : 'Established Account'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">Transactions (10 min)</span>
                    <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                      {transaction.TransactionsLast10Min} txns
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {transaction.TransactionsLast10Min >= 5 ? 'Velocity spike flagged' : 'Normal velocity'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">Failed Attempts (24h)</span>
                    <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                      {transaction.FailedAttemptsLast24H} fails
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {transaction.FailedAttemptsLast24H >= 3 ? 'Excessive failures' : 'Clean auth history'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">IP Risk Score</span>
                    <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                      {transaction.IPRiskScore}/100
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {transaction.IPRiskScore >= 70 ? 'Proxy / Tor / Botnet' : 'Clean residential IP'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">Merchant Risk Score</span>
                    <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                      {transaction.MerchantRiskScore}/100
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {transaction.MerchantRiskScore >= 70 ? 'High-chargeback MCC' : 'Standard merchant'}
                    </span>
                  </div>
                </div>

                {/* Behavioral Status Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    transaction.NewDeviceFlag
                      ? 'border-rose-800/80 bg-rose-950/30 text-rose-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}>
                    <span>New Device Flag</span>
                    <span className="font-semibold">{transaction.NewDeviceFlag ? 'YES (UNSEEN)' : 'NO (TRUSTED)'}</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    transaction.NewLocationFlag
                      ? 'border-rose-800/80 bg-rose-950/30 text-rose-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}>
                    <span>New Location Flag</span>
                    <span className="font-semibold">{transaction.NewLocationFlag ? 'YES (ANOMALOUS)' : 'NO (STANDARD)'}</span>
                  </div>

                  <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    transaction.InternationalFlag
                      ? 'border-rose-800/80 bg-rose-950/30 text-rose-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}>
                    <span>International Flag</span>
                    <span className="font-semibold">{transaction.InternationalFlag ? 'YES (CROSS-BORDER)' : 'NO (DOMESTIC)'}</span>
                  </div>
                </div>
              </div>

              {/* Triggered Factors */}
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Triggered Heuristic Risk Factors ({transaction.risk_factors.length})
                </h3>
                {transaction.risk_factors.length === 0 ? (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
                    No risk heuristics triggered. All telemetry signals are within normal limits.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transaction.risk_factors.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-200"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Explanation & Recommendations */}
              {(transaction.ai_explanation || (transaction.ai_recommended_next_steps && transaction.ai_recommended_next_steps.length > 0)) && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  {transaction.ai_explanation && transaction.ai_explanation !== 'AI explanation unavailable.' && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 mb-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Risk Rationale</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {transaction.ai_explanation}
                      </p>
                    </div>
                  )}

                  {transaction.ai_recommended_next_steps && transaction.ai_recommended_next_steps.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-xs font-semibold text-amber-400 mb-1.5">
                        Recommended Next Steps
                      </div>
                      <ul className="space-y-1">
                        {transaction.ai_recommended_next_steps.map((step, idx) => (
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Source: {transaction.source || 'n8n webhook'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
