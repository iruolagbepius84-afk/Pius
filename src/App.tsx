/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { RiskCharts } from './components/RiskCharts';
import { TransactionTable } from './components/TransactionTable';
import { ManualEntryForm } from './components/ManualEntryForm';
import { BulkUploadModal } from './components/BulkUploadModal';
import { EvaluationResultCard } from './components/EvaluationResultCard';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { FraudEvaluationResult, RiskLevel } from './types/fraud';
import { INITIAL_DEMO_TRANSACTIONS } from './utils/sampleData';
import {
  ShieldAlert,
  Sliders,
  Upload,
  BarChart2,
  RefreshCw,
  Plus,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEY = 'sentinel_fraud_transactions_v1';

export default function App() {
  const [transactions, setTransactions] = useState<FraudEvaluationResult[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading stored transactions:', e);
    }
    return INITIAL_DEMO_TRANSACTIONS;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'manual' | 'bulk'>('dashboard');
  const [isBulkOpen, setIsBulkOpen] = useState<boolean>(false);
  const [isManualLoading, setIsManualLoading] = useState<boolean>(false);
  const [latestManualResult, setLatestManualResult] = useState<FraudEvaluationResult | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<FraudEvaluationResult | null>(null);
  const [activeLevelFilter, setActiveLevelFilter] = useState<RiskLevel | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to persist transactions:', e);
    }
  }, [transactions]);

  const handleManualEvaluated = (result: FraudEvaluationResult) => {
    setLatestManualResult(result);
    setTransactions((prev) => [result, ...prev]);
  };

  const handleBatchCompleted = (batchResults: FraudEvaluationResult[]) => {
    setTransactions((prev) => [...batchResults, ...prev]);
    setIsBulkOpen(false);
    setActiveTab('dashboard');
  };

  const handleClearTransactions = () => {
    setTransactions([]);
    setLatestManualResult(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleLoadDemoData = () => {
    setTransactions(INITIAL_DEMO_TRANSACTIONS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBulk={() => setIsBulkOpen(true)}
        onNewManual={() => {
          setActiveTab('manual');
          setLatestManualResult(null);
        }}
        totalCount={transactions.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Latest Evaluation Result Alert (if freshly submitted via manual form) */}
        {latestManualResult && (
          <EvaluationResultCard
            result={latestManualResult}
            onClose={() => setLatestManualResult(null)}
            onViewDetails={(res) => setSelectedTransaction(res)}
          />
        )}

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <KpiSummaryCards transactions={transactions} />

            {/* Risk Charts Section */}
            <RiskCharts
              transactions={transactions}
              onSelectLevelFilter={setActiveLevelFilter}
              activeLevelFilter={activeLevelFilter}
            />

            {/* Results Table Section */}
            <TransactionTable
              transactions={transactions}
              onSelectTransaction={(t) => setSelectedTransaction(t)}
              onClearTransactions={handleClearTransactions}
              onLoadDemoData={handleLoadDemoData}
              activeLevelFilter={activeLevelFilter}
              onSelectLevelFilter={setActiveLevelFilter}
            />
          </div>
        )}

        {/* Tab 2: Manual Form View */}
        {activeTab === 'manual' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ManualEntryForm
              onTransactionEvaluated={handleManualEvaluated}
              isLoading={isManualLoading}
              setIsLoading={setIsManualLoading}
            />

            {/* Quick Link back to Dashboard */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
              <span className="text-slate-400">
                {transactions.length} total transactions logged in historical audit ledger.
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5"
              >
                <span>Go to Audit Dashboard</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Bulk Upload View */}
        {activeTab === 'bulk' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-rose-400 mb-2">
                  <Upload className="h-5 w-5" />
                  <h2 className="text-base font-semibold text-white">Bulk Ingestion Engine</h2>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Batch ingest CSV transactions or raw JSON arrays directly into the n8n fraud detection pipeline.
                  Each transaction is evaluated in real-time with automated concurrency controls and per-row error handling.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setIsBulkOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Open Bulk Upload Window</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Table of Existing Ingestions */}
            <TransactionTable
              transactions={transactions}
              onSelectTransaction={(t) => setSelectedTransaction(t)}
              onClearTransactions={handleClearTransactions}
              onLoadDemoData={handleLoadDemoData}
              activeLevelFilter={activeLevelFilter}
              onSelectLevelFilter={setActiveLevelFilter}
            />
          </div>
        )}
      </main>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onBatchCompleted={handleBatchCompleted}
      />

      {/* Audit Detail Modal Drawer */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sentinel Fraud Detection Platform · n8n Webhook Integration</span>
          <span className="font-mono text-[11px] text-slate-500">
            Endpoint: /webhook/fraud-detection
          </span>
        </div>
      </footer>
    </div>
  );
}
