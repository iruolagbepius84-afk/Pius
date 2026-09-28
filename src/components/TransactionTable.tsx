import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { FraudEvaluationResult, RiskLevel } from '../types/fraud';

interface TransactionTableProps {
  transactions: FraudEvaluationResult[];
  onSelectTransaction: (transaction: FraudEvaluationResult) => void;
  onClearTransactions: () => void;
  onLoadDemoData: () => void;
  activeLevelFilter?: RiskLevel | null;
  onSelectLevelFilter?: (level: RiskLevel | null) => void;
}

type SortField = 'evaluated_at' | 'AmountCAD' | 'risk_score' | 'risk_factor_count';
type SortOrder = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onSelectTransaction,
  onClearTransactions,
  onLoadDemoData,
  activeLevelFilter,
  onSelectLevelFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFlagged, setOnlyFlagged] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('evaluated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (onlyFlagged && !t.flagged) {
        return false;
      }
      if (activeLevelFilter && t.risk_level !== activeLevelFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = t.id?.toLowerCase().includes(query);
        const matchesStatus = t.alert_status?.toLowerCase().includes(query);
        const matchesLevel = t.risk_level?.toLowerCase().includes(query);
        const matchesAmount = t.AmountCAD.toString().includes(query);
        const matchesFactor = t.risk_factors?.some((f) => f.toLowerCase().includes(query));
        const matchesAi = t.ai_explanation?.toLowerCase().includes(query);
        if (!matchesId && !matchesStatus && !matchesLevel && !matchesAmount && !matchesFactor && !matchesAi) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, onlyFlagged, activeLevelFilter, searchQuery]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'evaluated_at') {
        valA = new Date(a.evaluated_at || 0).getTime();
        valB = new Date(b.evaluated_at || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedTransactions.length / pageSize) || 1;
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = [
      'TransactionID',
      'EvaluatedAt',
      'AmountCAD',
      'CustomerAverageAmountCAD',
      'RiskScore',
      'RiskLevel',
      'Flagged',
      'AlertStatus',
      'RiskFactorCount',
      'RiskFactors',
      'AIExplanation',
    ];
    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${t.evaluated_at}"`,
      t.AmountCAD,
      t.CustomerAverageAmountCAD,
      t.risk_score,
      `"${t.risk_level}"`,
      t.flagged,
      `"${t.alert_status}"`,
      t.risk_factor_count,
      `"${(t.risk_factors || []).join('; ')}"`,
      `"${(t.ai_explanation || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fraud_evaluations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (transactions.length === 0) return;
    const blob = new Blob([JSON.stringify(transactions, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fraud_evaluations_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm overflow-hidden flex flex-col">
      {/* Top Filter and Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Evaluated Transactions Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {sortedTransactions.length} of {transactions.length} records · Color-coded: Red (Flagged) / Green (Cleared)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors"
              title="Export filtered records as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportJSON}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors"
              title="Export filtered records as JSON"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
            {transactions.length > 0 ? (
              <button
                onClick={() => {
                  if (confirm('Clear all recorded transactions from storage?')) {
                    onClearTransactions();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-rose-900/40 transition-colors"
                title="Clear all stored evaluation logs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear History</span>
              </button>
            ) : (
              <button
                onClick={onLoadDemoData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-lg hover:bg-rose-900 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Load Sample Dataset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by risk factor, ID, amount, status..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Toggle "Show only flagged transactions" */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setOnlyFlagged(!onlyFlagged);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                onlyFlagged
                  ? 'border-rose-600 bg-rose-950/80 text-rose-300 shadow-sm'
                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Only Flagged Transactions</span>
              {onlyFlagged && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
            </button>

            {/* Level Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
              {(['All', 'Low', 'Medium', 'High', 'Critical'] as const).map((lvl) => {
                const isAll = lvl === 'All';
                const isSelected = isAll ? !activeLevelFilter : activeLevelFilter === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      onSelectLevelFilter?.(isAll ? null : (lvl as RiskLevel));
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Status & Level</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
                onClick={() => handleSort('AmountCAD')}
              >
                <div className="flex items-center gap-1">
                  <span>Amount (CAD)</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
                onClick={() => handleSort('risk_score')}
              >
                <div className="flex items-center gap-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
                onClick={() => handleSort('risk_factor_count')}
              >
                <div className="flex items-center gap-1">
                  <span>Key Risk Factors</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
                onClick={() => handleSort('evaluated_at')}
              >
                <div className="flex items-center gap-1">
                  <span>Evaluated</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-slate-600 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-400">No transactions match current filters</p>
                    <p className="text-xs text-slate-600 mt-1">Try resetting the search query or risk filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t) => {
                const isFlagged = t.flagged;
                const isCritical = t.risk_level === 'Critical';
                const isHigh = t.risk_level === 'High';
                const isMedium = t.risk_level === 'Medium';

                // Color-code row: Red tint for flagged, green tint for cleared
                const rowClass = isFlagged
                  ? 'bg-rose-950/20 hover:bg-rose-950/40 border-l-4 border-l-rose-500'
                  : 'bg-emerald-950/10 hover:bg-emerald-950/25 border-l-4 border-l-emerald-500';

                const levelBadgeClass = isCritical
                  ? 'text-rose-400 font-semibold'
                  : isHigh
                  ? 'text-orange-400 font-semibold'
                  : isMedium
                  ? 'text-amber-400 font-semibold'
                  : 'text-emerald-400 font-semibold';

                const topFactors = (t.risk_factors || []).slice(0, 2);
                const remainingFactorsCount = Math.max(0, (t.risk_factors?.length || 0) - 2);

                return (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTransaction(t)}
                    className={`cursor-pointer transition-colors ${rowClass}`}
                  >
                    {/* Status & Level */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isFlagged ? (
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        <span className="font-semibold text-white">
                          {isFlagged ? 'FLAGGED' : 'CLEARED'}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className={levelBadgeClass}>{t.risk_level}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[140px]">
                        {t.id}
                      </div>
                    </td>

                    {/* Amount (CAD) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-white tabular-nums text-sm">
                        ${t.AmountCAD.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        avg: ${t.CustomerAverageAmountCAD} ({t.CustomerAverageAmountCAD > 0 ? (t.AmountCAD / t.CustomerAverageAmountCAD).toFixed(1) : 1}x)
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-base font-bold tabular-nums ${
                            t.risk_score >= 80
                              ? 'text-rose-400'
                              : t.risk_score >= 50
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {t.risk_score}
                        </span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              t.risk_score >= 80
                                ? 'bg-rose-500'
                                : t.risk_score >= 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(4, t.risk_score))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Key Risk Factors */}
                    <td className="py-3 px-4 max-w-xs">
                      {t.risk_factors && t.risk_factors.length > 0 ? (
                        <div className="space-y-1">
                          {topFactors.map((f, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-slate-300 truncate"
                              title={f}
                            >
                              · {f}
                            </div>
                          ))}
                          {remainingFactorsCount > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              +{remainingFactorsCount} additional factor{remainingFactorsCount > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">None triggered</span>
                      )}
                    </td>

                    {/* Evaluated At */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      <div>{new Date(t.evaluated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(t.evaluated_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(t);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono tabular-nums">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
