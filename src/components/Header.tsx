import React from 'react';
import { ShieldAlert, Plus, Upload, RefreshCw, BarChart2, Shield } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'manual' | 'bulk';
  setActiveTab: (tab: 'dashboard' | 'manual' | 'bulk') => void;
  onOpenBulk: () => void;
  onNewManual: () => void;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenBulk,
  onNewManual,
  totalCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Sentinel Fraud Ops
          </span>
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500 tabular-nums">
            {totalCount} events logged
          </span>
        </div>

        {/* Zone 2: Navigation Links / View Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              onNewManual();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Manual Entry</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('bulk');
              onOpenBulk();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Bulk Upload</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBulk}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>Upload CSV</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              onNewManual();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm shadow-rose-900/40 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};
