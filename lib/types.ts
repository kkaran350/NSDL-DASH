export interface Holding {
  isin: string;
  description: string;
  lastTransactionDate: string;
  quantity: number;
  price: number;
  value: number;
}

export interface HoldingsSnapshot {
  fetchedAt: string; // ISO timestamp
  holdings: Holding[];
}

export interface QuantityDelta {
  isin: string;
  previousQuantity: number;
  currentQuantity: number;
  change: number;
}
