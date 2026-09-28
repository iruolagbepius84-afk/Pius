import React, { useState } from 'react';
import {
  Send,
  Loader2,
  Sliders,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Check,
  Smartphone,
  MapPin,
  Globe,
} from 'lucide-react';
import { FraudEvaluationResult, FraudTransactionInput } from '../types/fraud';
import { evaluateTransaction } from '../services/fraudApi';
import { PRESET_SCENARIOS } from '../utils/sampleData';

interface ManualEntryFormProps {
  onTransactionEvaluated: (result: FraudEvaluationResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DEFAULT_FORM_STATE: FraudTransactionInput = {
  AmountCAD: 8200,
  CustomerAverageAmountCAD: 400,
  NewDeviceFlag: true,
  NewLocationFlag: true,
  TransactionsLast10Min: 6,
  InternationalFlag: true,
  FailedAttemptsLast24H: 3,
  IPRiskScore: 85,
  MerchantRiskScore: 75,
  AccountAgeDays: 12,
};

export const ManualEntryForm: React.FC<ManualEntryFormProps> = ({
  onTransactionEvaluated,
  isLoading,
  setIsLoading,
}) => {
  const [formData, setFormData] = useState<FraudTransactionInput>(DEFAULT_FORM_STATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('account_takeover');

  const handleInputChange = (field: keyof FraudTransactionInput, value: number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (preset) {
      setFormData(preset.data);
      setSelectedPresetId(presetId);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await evaluateTransaction(formData, 'manual');
      onTransactionEvaluated(result);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to submit transaction to the fraud detection webhook.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM_STATE);
    setSelectedPresetId('account_takeover');
    setErrorMessage(null);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-rose-400" />
            <span>Manual Transaction Risk Evaluation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit 10 real-time transaction indicators to the n8n rule engine and AI assessment pipeline.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Test Presets:</span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                selectedPresetId === preset.id
                  ? 'border-rose-500/80 bg-rose-950/40 text-rose-300 font-medium'
                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={preset.description}
            >
              {preset.name.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-lg border border-rose-800/80 bg-rose-950/50 flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block text-rose-200">Webhook Request Error</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Section 1: Financial & Customer Metrics */}
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Financial & Profile Spend Parameters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount CAD */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Amount (CAD) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formData.AmountCAD}
                  onChange={(e) => handleInputChange('AmountCAD', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  placeholder="8200"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Transaction value for authorization</p>
            </div>

            {/* Customer Average Amount CAD */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Customer Avg Amount (CAD) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={formData.CustomerAverageAmountCAD}
                  onChange={(e) =>
                    handleInputChange('CustomerAverageAmountCAD', parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  placeholder="400"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Historical mean: {formData.CustomerAverageAmountCAD > 0 ? (formData.AmountCAD / formData.CustomerAverageAmountCAD).toFixed(1) : 0}x multiplier
              </p>
            </div>

            {/* Account Age Days */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Account Age (Days) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.AccountAgeDays}
                onChange={(e) =>
                  handleInputChange('AccountAgeDays', parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                placeholder="12"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {formData.AccountAgeDays < 30 ? 'High risk (new account < 30d)' : 'Mature account'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Velocity & Security Attempts */}
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Velocity & Security Telemetry
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Transactions Last 10 Min */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Txns in Last 10 Min
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.TransactionsLast10Min}
                onChange={(e) =>
                  handleInputChange('TransactionsLast10Min', parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                placeholder="6"
              />
              <p className="text-[11px] text-slate-500 mt-1">Velocity threshold: ≥ 5 txns flags velocity spike</p>
            </div>

            {/* Failed Attempts Last 24H */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Failed Attempts (24h)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.FailedAttemptsLast24H}
                onChange={(e) =>
                  handleInputChange('FailedAttemptsLast24H', parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                placeholder="3"
              />
              <p className="text-[11px] text-slate-500 mt-1">Brute-force / CVV failure counter</p>
            </div>

            {/* IP Risk Score (0 - 100) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  IP Risk Score (0-100)
                </label>
                <span className={`text-xs font-mono font-bold ${formData.IPRiskScore >= 70 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {formData.IPRiskScore}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.IPRiskScore}
                onChange={(e) => handleInputChange('IPRiskScore', parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 (Clean)</span>
                <span>70 (Elevated)</span>
                <span>100 (Blacklist)</span>
              </div>
            </div>

            {/* Merchant Risk Score (0 - 100) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Merchant Risk (0-100)
                </label>
                <span className={`text-xs font-mono font-bold ${formData.MerchantRiskScore >= 70 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {formData.MerchantRiskScore}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.MerchantRiskScore}
                onChange={(e) => handleInputChange('MerchantRiskScore', parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0 (Verified)</span>
                <span>70 (High Risk)</span>
                <span>100 (MCC Flag)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Boolean Flags (Toggles) */}
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Anomalous Behavioral Flags
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* New Device Flag */}
            <div
              onClick={() => handleInputChange('NewDeviceFlag', !formData.NewDeviceFlag)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                formData.NewDeviceFlag
                  ? 'border-rose-600/80 bg-rose-950/30 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.NewDeviceFlag ? 'bg-rose-900/60 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">New Device Flag</div>
                  <div className="text-[11px] text-slate-400">Unseen browser or hardware ID</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                formData.NewDeviceFlag ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-600 bg-slate-800'
              }`}>
                {formData.NewDeviceFlag && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* New Location Flag */}
            <div
              onClick={() => handleInputChange('NewLocationFlag', !formData.NewLocationFlag)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                formData.NewLocationFlag
                  ? 'border-rose-600/80 bg-rose-950/30 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.NewLocationFlag ? 'bg-rose-900/60 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">New Location Flag</div>
                  <div className="text-[11px] text-slate-400">Unusual city / ISP routing</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                formData.NewLocationFlag ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-600 bg-slate-800'
              }`}>
                {formData.NewLocationFlag && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>

            {/* International Flag */}
            <div
              onClick={() => handleInputChange('InternationalFlag', !formData.InternationalFlag)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                formData.InternationalFlag
                  ? 'border-rose-600/80 bg-rose-950/30 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.InternationalFlag ? 'bg-rose-900/60 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">International Flag</div>
                  <div className="text-[11px] text-slate-400">Cross-border merchant settlement</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                formData.InternationalFlag ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-600 bg-slate-800'
              }`}>
                {formData.InternationalFlag && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-rose-950/60 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating with n8n Webhook...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Transaction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
