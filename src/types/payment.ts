export type Payment = {
  id: string, // This should be regexed
  customerName: string;
  amount: float;
  customerAddress: string;
  currency: "USD" | "EUR" | "GBP" | "AUD" | "CAD" | "ZAR" | "JPY" | "CZK";
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
