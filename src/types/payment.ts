export type Currency = "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "ZAR" | "JPY" | "CZK";

export type SearchCurrency = Currency & '';

export type Payment = {
  id: string, // This should be regexed
  customerName: string;
  amount: number;
  customerAddress: string;
  currency: Currency;
  status: string;
  date: string; // Should be constrained to valid data string patterns
  description: string;
  clientId: string; // This should be regexed
}

export type PaymentSearchResponse = {
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
}

export type ErrorStatus = 404 | 500;
