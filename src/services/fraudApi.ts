import { FraudEvaluationResult, FraudTransactionInput } from '../types/fraud';

const WEBHOOK_URL = 'https://tenalyticsbusiness.app.n8n.cloud/webhook/fraud-detection';

/**
 * Normalizes an input object so that numbers and booleans are strictly typed.
 */
export function sanitizeInput(input: Partial<FraudTransactionInput>): FraudTransactionInput {
  return {
    AmountCAD: Number(input.AmountCAD) || 0,
    CustomerAverageAmountCAD: Number(input.CustomerAverageAmountCAD) || 0,
    NewDeviceFlag: Boolean(input.NewDeviceFlag),
    NewLocationFlag: Boolean(input.NewLocationFlag),
    TransactionsLast10Min: Math.max(0, Math.floor(Number(input.TransactionsLast10Min) || 0)),
    InternationalFlag: Boolean(input.InternationalFlag),
    FailedAttemptsLast24H: Math.max(0, Math.floor(Number(input.FailedAttemptsLast24H) || 0)),
    IPRiskScore: Math.min(100, Math.max(0, Math.floor(Number(input.IPRiskScore) || 0))),
    MerchantRiskScore: Math.min(100, Math.max(0, Math.floor(Number(input.MerchantRiskScore) || 0))),
    AccountAgeDays: Math.max(0, Math.floor(Number(input.AccountAgeDays) || 0)),
  };
}

/**
 * Evaluates a single transaction against the n8n webhook.
 */
export async function evaluateTransaction(
  rawInput: FraudTransactionInput,
  source: 'manual' | 'bulk_csv' | 'bulk_json' | 'sample_data' = 'manual'
): Promise<FraudEvaluationResult> {
  const payload = sanitizeInput(rawInput);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Server error');
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();

    // Generate unique ID and normalize fields
    const result: FraudEvaluationResult = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      AmountCAD: typeof data.AmountCAD === 'number' ? data.AmountCAD : payload.AmountCAD,
      CustomerAverageAmountCAD: typeof data.CustomerAverageAmountCAD === 'number' ? data.CustomerAverageAmountCAD : payload.CustomerAverageAmountCAD,
      NewDeviceFlag: typeof data.NewDeviceFlag === 'boolean' ? data.NewDeviceFlag : payload.NewDeviceFlag,
      NewLocationFlag: typeof data.NewLocationFlag === 'boolean' ? data.NewLocationFlag : payload.NewLocationFlag,
      TransactionsLast10Min: typeof data.TransactionsLast10Min === 'number' ? data.TransactionsLast10Min : payload.TransactionsLast10Min,
      InternationalFlag: typeof data.InternationalFlag === 'boolean' ? data.InternationalFlag : payload.InternationalFlag,
      FailedAttemptsLast24H: typeof data.FailedAttemptsLast24H === 'number' ? data.FailedAttemptsLast24H : payload.FailedAttemptsLast24H,
      IPRiskScore: typeof data.IPRiskScore === 'number' ? data.IPRiskScore : payload.IPRiskScore,
      MerchantRiskScore: typeof data.MerchantRiskScore === 'number' ? data.MerchantRiskScore : payload.MerchantRiskScore,
      AccountAgeDays: typeof data.AccountAgeDays === 'number' ? data.AccountAgeDays : payload.AccountAgeDays,
      
      risk_score: typeof data.risk_score === 'number' ? data.risk_score : 50,
      risk_level: data.risk_level || (data.flagged ? 'High' : 'Low'),
      flagged: Boolean(data.flagged),
      alert_status: data.alert_status || (data.flagged ? 'FLAGGED_FOR_REVIEW' : 'CLEARED_BY_RULE_ENGINE'),
      risk_factors: Array.isArray(data.risk_factors) ? data.risk_factors : [],
      risk_factor_count: typeof data.risk_factor_count === 'number' ? data.risk_factor_count : (data.risk_factors?.length || 0),
      investigation_required: Boolean(data.investigation_required),
      evaluated_at: data.evaluated_at || new Date().toISOString(),
      ai_explanation: data.ai_explanation || '',
      ai_recommended_next_steps: Array.isArray(data.ai_recommended_next_steps) ? data.ai_recommended_next_steps : [],
      ai_risk_factors: Array.isArray(data.ai_risk_factors) ? data.ai_risk_factors : undefined,
      ai_investigation_questions: Array.isArray(data.ai_investigation_questions) ? data.ai_investigation_questions : undefined,
      ai_decision_note: data.ai_decision_note || undefined,
      source,
    };

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Fraud webhook request timed out after 25s. The n8n cloud service might be experiencing high load.');
    }
    throw err;
  }
}

/**
 * Concurrently process a list of transactions with controlled concurrency (e.g. 2-3 at a time)
 * to avoid overwhelming the webhook while keeping throughput fast.
 */
export async function evaluateBatchTransactions(
  inputs: FraudTransactionInput[],
  concurrency = 2,
  onProgress?: (progress: { completed: number; total: number; currentItem?: FraudEvaluationResult; errorItem?: { index: number; error: string } }) => void,
  shouldAbort?: () => boolean
): Promise<{ successful: FraudEvaluationResult[]; failed: { index: number; input: FraudTransactionInput; error: string }[] }> {
  const successful: FraudEvaluationResult[] = [];
  const failed: { index: number; input: FraudTransactionInput; error: string }[] = [];
  let completed = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < inputs.length) {
      if (shouldAbort && shouldAbort()) {
        break;
      }
      const idx = currentIndex++;
      const item = inputs[idx];
      try {
        const res = await evaluateTransaction(item, 'bulk_csv');
        successful.push(res);
        completed++;
        onProgress?.({ completed, total: inputs.length, currentItem: res });
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to evaluate transaction';
        failed.push({ index: idx, input: item, error: errorMsg });
        completed++;
        onProgress?.({ completed, total: inputs.length, errorItem: { index: idx, error: errorMsg } });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, inputs.length) }, () => worker());
  await Promise.all(workers);

  return { successful, failed };
}
