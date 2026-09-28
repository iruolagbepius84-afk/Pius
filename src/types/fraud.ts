export interface FraudTransactionInput {
  AmountCAD: number;
  CustomerAverageAmountCAD: number;
  NewDeviceFlag: boolean;
  NewLocationFlag: boolean;
  TransactionsLast10Min: number;
  InternationalFlag: boolean;
  FailedAttemptsLast24H: number;
  IPRiskScore: number;
  MerchantRiskScore: number;
  AccountAgeDays: number;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertStatus = 'FLAGGED_FOR_REVIEW' | 'CLEARED_BY_RULE_ENGINE' | string;

export interface FraudEvaluationResult extends FraudTransactionInput {
  id: string;
  risk_score: number;
  risk_level: RiskLevel;
  flagged: boolean;
  alert_status: AlertStatus;
  risk_factors: string[];
  risk_factor_count: number;
  investigation_required: boolean;
  evaluated_at: string;
  ai_explanation?: string;
  ai_recommended_next_steps?: string[];
  ai_risk_factors?: string[];
  ai_investigation_questions?: string[];
  ai_decision_note?: string;
  source?: 'manual' | 'bulk_csv' | 'bulk_json' | 'sample_data';
  raw_error?: string;
}

export interface BatchItemProgress {
  index: number;
  input: FraudTransactionInput;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: FraudEvaluationResult;
  error?: string;
}

export interface KpiMetrics {
  totalCount: number;
  flaggedCount: number;
  clearedCount: number;
  avgRiskScore: number;
  flaggedRate: number;
  totalVolumeCAD: number;
  flaggedVolumeCAD: number;
}
