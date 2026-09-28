import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Code,
  X,
  Play,
  StopCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { FraudEvaluationResult, FraudTransactionInput } from '../types/fraud';
import { parseCSV, parseJSON, SAMPLE_CSV_CONTENT } from '../utils/csvParser';
import { evaluateBatchTransactions } from '../services/fraudApi';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCompleted: (results: FraudEvaluationResult[]) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onBatchCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'csv_file' | 'csv_text' | 'json_text'>('csv_file');
  const [rawText, setRawText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<FraudTransactionInput[] | null>(null);

  // Batch progress state
  const [progressCount, setProgressCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [successList, setSuccessList] = useState<FraudEvaluationResult[]>([]);
  const [failedList, setFailedList] = useState<{ index: number; error: string }[]>([]);
  const abortRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      validateContent(content, 'csv');
    };
    reader.readAsText(file);
  };

  const validateContent = (text: string, type: 'csv' | 'json') => {
    setParseErrors([]);
    setParsedData(null);

    if (!text.trim()) {
      setParseErrors(['Input content is empty']);
      return;
    }

    if (type === 'csv') {
      const result = parseCSV(text);
      if (result.errors.length > 0) {
        setParseErrors(result.errors.map((e) => `Row ${e.row}: ${e.message}`));
      }
      if (result.data.length > 0) {
        setParsedData(result.data);
      }
    } else {
      const result = parseJSON(text);
      if (result.errors.length > 0) {
        setParseErrors(result.errors.map((e) => e.message));
      }
      if (result.data.length > 0) {
        setParsedData(result.data);
      }
    }
  };

  const loadSampleCSV = () => {
    setRawText(SAMPLE_CSV_CONTENT);
    setActiveTab('csv_text');
    validateContent(SAMPLE_CSV_CONTENT, 'csv');
  };

  const downloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fraud_transactions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startBatchExecution = async () => {
    if (!parsedData || parsedData.length === 0) return;

    abortRef.current = false;
    setIsProcessing(true);
    setProgressCount(0);
    setTotalCount(parsedData.length);
    setSuccessList([]);
    setFailedList([]);

    const batchResults = await evaluateBatchTransactions(
      parsedData,
      2, // concurrency
      (progress) => {
        setProgressCount(progress.completed);
        if (progress.currentItem) {
          setSuccessList((prev) => [...prev, progress.currentItem!]);
        }
        if (progress.errorItem) {
          setFailedList((prev) => [...prev, progress.errorItem!]);
        }
      },
      () => abortRef.current
    );

    setIsProcessing(false);
    if (batchResults.successful.length > 0) {
      onBatchCompleted(batchResults.successful);
    }
  };

  const stopBatchExecution = () => {
    abortRef.current = true;
    setIsProcessing(false);
  };

  const progressPercentage = totalCount > 0 ? Math.round((progressCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-900/60 text-rose-400">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Bulk Transaction Risk Ingestion</h2>
              <p className="text-xs text-slate-400">Upload CSV or JSON dataset to batch-score via webhook</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isProcessing) stopBatchExecution();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Method Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('csv_file');
                  if (rawText) validateContent(rawText, 'csv');
                }}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'csv_file'
                    ? 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Upload CSV File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('csv_text');
                  if (rawText) validateContent(rawText, 'csv');
                }}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'csv_text'
                    ? 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Paste CSV Raw</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('json_text');
                  if (rawText) validateContent(rawText, 'json');
                }}
                disabled={isProcessing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'json_text'
                    ? 'bg-rose-950/50 border border-rose-800/80 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Paste JSON Array</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadSampleCSV}
                disabled={isProcessing}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
              >
                Load Sample 8-Row Batch
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                title="Download CSV Header Template"
              >
                <Download className="h-3 w-3" />
                <span>CSV Template</span>
              </button>
            </div>
          </div>

          {/* Tab 1: File Dropzone */}
          {activeTab === 'csv_file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-rose-500/80 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-all group"
              >
                <Upload className="h-8 w-8 mx-auto text-slate-500 group-hover:text-rose-400 mb-2 transition-colors" />
                <p className="text-sm font-medium text-slate-300 group-hover:text-white">
                  Click to browse or drop CSV file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Accepts CSV format with 10 standard schema headers
                </p>
              </div>
            </div>
          )}

          {/* Tab 2 & 3: Textarea for CSV or JSON */}
          {(activeTab === 'csv_text' || activeTab === 'json_text') && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {activeTab === 'csv_text' ? 'CSV Content (with header row)' : 'JSON Array of Transactions'}
              </label>
              <textarea
                rows={6}
                value={rawText}
                disabled={isProcessing}
                onChange={(e) => {
                  setRawText(e.target.value);
                  validateContent(e.target.value, activeTab === 'csv_text' ? 'csv' : 'json');
                }}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                placeholder={
                  activeTab === 'csv_text'
                    ? 'AmountCAD,CustomerAverageAmountCAD,NewDeviceFlag,NewLocationFlag,TransactionsLast10Min,InternationalFlag,FailedAttemptsLast24H,IPRiskScore,MerchantRiskScore,AccountAgeDays\n8200,400,true,true,6,true,3,85,75,12'
                    : '[\n  {\n    "AmountCAD": 8200,\n    "CustomerAverageAmountCAD": 400,\n    "NewDeviceFlag": true,\n    "NewLocationFlag": true,\n    "TransactionsLast10Min": 6,\n    "InternationalFlag": true,\n    "FailedAttemptsLast24H": 3,\n    "IPRiskScore": 85,\n    "MerchantRiskScore": 75,\n    "AccountAgeDays": 12\n  }\n]'
                }
              />
            </div>
          )}

          {/* Validation & Ready Summary */}
          {parsedData && parsedData.length > 0 && (
            <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">
                  {parsedData.length} valid transactions ready for webhook evaluation
                </span>
              </div>
              <span className="font-mono text-slate-400">
                Total CAD: ${parsedData.reduce((s, r) => s + (r.AmountCAD || 0), 0).toLocaleString()}
              </span>
            </div>
          )}

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Parsing / Schema Warnings:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] max-h-24 overflow-y-auto font-mono">
                {parseErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* In-Flight Batch Progress Bar */}
          {totalCount > 0 && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                  ) : progressCount === totalCount ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  )}
                  <span className="font-semibold text-white">
                    {isProcessing
                      ? `Evaluating batch: ${progressCount} of ${totalCount} transactions (${progressPercentage}%)`
                      : `Batch complete: ${successList.length} succeeded, ${failedList.length} failed`}
                  </span>
                </div>
                <span className="font-mono text-slate-400 tabular-nums">
                  {progressCount} / {totalCount}
                </span>
              </div>

              {/* Progress track */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Progress breakdown */}
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span className="text-emerald-400">{successList.length} completed</span>
                {failedList.length > 0 && (
                  <span className="text-rose-400">{failedList.length} failed</span>
                )}
                <span>Rate: 2 concurrent POSTs</span>
              </div>

              {/* Failed rows notice */}
              {failedList.length > 0 && (
                <div className="mt-2 text-[11px] text-rose-300 font-mono max-h-16 overflow-y-auto">
                  {failedList.map((f, i) => (
                    <div key={i}>Row {f.index + 1}: {f.error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg border border-slate-700 bg-slate-800 transition-colors"
          >
            {successList.length > 0 ? 'Close & View Dashboard' : 'Cancel'}
          </button>

          <div className="flex items-center gap-3">
            {isProcessing ? (
              <button
                type="button"
                onClick={stopBatchExecution}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-300 bg-rose-950/80 border border-rose-800 rounded-lg hover:bg-rose-900 transition-colors"
              >
                <StopCircle className="h-4 w-4" />
                <span>Stop Processing</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!parsedData || parsedData.length === 0}
                onClick={startBatchExecution}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Batch Ingestion ({parsedData?.length || 0})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
