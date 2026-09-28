import { FraudTransactionInput } from '../types/fraud';

export const CSV_HEADER_COLUMNS = [
  'AmountCAD',
  'CustomerAverageAmountCAD',
  'NewDeviceFlag',
  'NewLocationFlag',
  'TransactionsLast10Min',
  'InternationalFlag',
  'FailedAttemptsLast24H',
  'IPRiskScore',
  'MerchantRiskScore',
  'AccountAgeDays',
] as const;

export const SAMPLE_CSV_CONTENT = `AmountCAD,CustomerAverageAmountCAD,NewDeviceFlag,NewLocationFlag,TransactionsLast10Min,InternationalFlag,FailedAttemptsLast24H,IPRiskScore,MerchantRiskScore,AccountAgeDays
8200,400,true,true,6,true,3,85,75,12
45,60,false,false,1,false,0,12,15,640
3400,280,true,false,4,false,2,78,65,45
120,150,false,false,1,false,0,18,22,320
6500,500,true,true,7,true,4,92,80,8
85,90,false,false,2,false,0,25,30,410
4100,350,false,true,5,true,1,64,70,95
29,35,false,false,1,false,0,10,12,890`;

export function parseBooleanValue(val: any): boolean {
  if (typeof val === 'boolean') return val;
  const str = String(val ?? '').trim().toLowerCase();
  return str === 'true' || str === '1' || str === 'yes' || str === 'y' || str === 't';
}

export function parseNumberValue(val: any, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  // Clean currency symbols, commas
  const cleaned = String(val ?? '').replace(/[$, ]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

export interface ParseResult {
  data: FraudTransactionInput[];
  errors: { row: number; message: string }[];
  totalRows: number;
}

/**
 * Parses raw CSV text into array of FraudTransactionInput objects.
 */
export function parseCSV(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    return { data: [], errors: [{ row: 0, message: 'CSV file is empty' }], totalRows: 0 };
  }

  // Parse header line
  const headerTokens = parseCsvRow(lines[0]).map(h => h.trim());
  const headerMap: { [key: string]: number } = {};

  headerTokens.forEach((header, index) => {
    // Case-insensitive clean match
    const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const expected of CSV_HEADER_COLUMNS) {
      if (expected.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized) {
        headerMap[expected] = index;
      }
    }
  });

  // Verify missing required headers
  const missingHeaders = CSV_HEADER_COLUMNS.filter(col => headerMap[col] === undefined);
  if (missingHeaders.length > 0) {
    return {
      data: [],
      errors: [
        {
          row: 1,
          message: `Missing required header column(s): ${missingHeaders.join(', ')}. Expected: ${CSV_HEADER_COLUMNS.join(', ')}`,
        },
      ],
      totalRows: lines.length - 1,
    };
  }

  const data: FraudTransactionInput[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawTokens = parseCsvRow(lines[i]);
    if (rawTokens.length === 0 || (rawTokens.length === 1 && !rawTokens[0])) {
      continue; // skip blank line
    }

    try {
      const item: FraudTransactionInput = {
        AmountCAD: parseNumberValue(rawTokens[headerMap['AmountCAD']]),
        CustomerAverageAmountCAD: parseNumberValue(rawTokens[headerMap['CustomerAverageAmountCAD']]),
        NewDeviceFlag: parseBooleanValue(rawTokens[headerMap['NewDeviceFlag']]),
        NewLocationFlag: parseBooleanValue(rawTokens[headerMap['NewLocationFlag']]),
        TransactionsLast10Min: Math.max(0, Math.round(parseNumberValue(rawTokens[headerMap['TransactionsLast10Min']]))),
        InternationalFlag: parseBooleanValue(rawTokens[headerMap['InternationalFlag']]),
        FailedAttemptsLast24H: Math.max(0, Math.round(parseNumberValue(rawTokens[headerMap['FailedAttemptsLast24H']]))),
        IPRiskScore: Math.min(100, Math.max(0, Math.round(parseNumberValue(rawTokens[headerMap['IPRiskScore']])))),
        MerchantRiskScore: Math.min(100, Math.max(0, Math.round(parseNumberValue(rawTokens[headerMap['MerchantRiskScore']])))),
        AccountAgeDays: Math.max(0, Math.round(parseNumberValue(rawTokens[headerMap['AccountAgeDays']]))),
      };

      data.push(item);
    } catch (e: any) {
      errors.push({ row: i + 1, message: `Could not parse row ${i + 1}: ${e?.message || 'Invalid row formatting'}` });
    }
  }

  return {
    data,
    errors,
    totalRows: lines.length - 1,
  };
}

/**
 * Parses raw JSON string into array of FraudTransactionInput objects.
 */
export function parseJSON(jsonText: string): ParseResult {
  try {
    const parsed = JSON.parse(jsonText);
    const array = Array.isArray(parsed) ? parsed : [parsed];

    const data: FraudTransactionInput[] = [];
    const errors: { row: number; message: string }[] = [];

    array.forEach((obj, idx) => {
      if (typeof obj !== 'object' || obj === null) {
        errors.push({ row: idx + 1, message: `Item ${idx + 1} is not a valid JSON object` });
        return;
      }

      data.push({
        AmountCAD: parseNumberValue(obj.AmountCAD),
        CustomerAverageAmountCAD: parseNumberValue(obj.CustomerAverageAmountCAD),
        NewDeviceFlag: parseBooleanValue(obj.NewDeviceFlag),
        NewLocationFlag: parseBooleanValue(obj.NewLocationFlag),
        TransactionsLast10Min: Math.max(0, Math.round(parseNumberValue(obj.TransactionsLast10Min))),
        InternationalFlag: parseBooleanValue(obj.InternationalFlag),
        FailedAttemptsLast24H: Math.max(0, Math.round(parseNumberValue(obj.FailedAttemptsLast24H))),
        IPRiskScore: Math.min(100, Math.max(0, Math.round(parseNumberValue(obj.IPRiskScore)))),
        MerchantRiskScore: Math.min(100, Math.max(0, Math.round(parseNumberValue(obj.MerchantRiskScore)))),
        AccountAgeDays: Math.max(0, Math.round(parseNumberValue(obj.AccountAgeDays))),
      });
    });

    return {
      data,
      errors,
      totalRows: array.length,
    };
  } catch (e: any) {
    return {
      data: [],
      errors: [{ row: 0, message: `Invalid JSON syntax: ${e?.message || 'Unable to parse'}` }],
      totalRows: 0,
    };
  }
}

/**
 * Handles quoted CSV tokens with commas
 */
function parseCsvRow(rowText: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      if (inQuotes && rowText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
