export interface Holding {
  isin: string;
  description: string;
  lastTransactionDate: string;
  quantity: number;
  price: number;
  value: number;
}

export interface DailyChange {
  isin: string;
  additions: number;
  subtractions: number;
  net: number;
}

/** A single detected quantity change, as stored in the Movements sheet. */
export interface Movement {
  previousQuantity: number;
  currentQuantity: number;
  change: number;
  detectedAt: string; // ISO timestamp
}

/** All of today's movements for one ISIN, individually and summed. */
export interface IsinMovements {
  isin: string;
  description: string;
  additions: number;
  subtractions: number;
  net: number;
  transactions: Movement[];
}

/** Response shape for GET /api/movements/today. */
export interface TodayMovements {
  ledgerDate: string; // yyyy-mm-dd, IST
  totals: { additions: number; subtractions: number };
  byIsin: IsinMovements[];
}