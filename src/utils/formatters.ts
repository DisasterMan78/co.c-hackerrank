import { format } from "date-fns";

export const formatAmount = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (typeof numericAmount === "number" && !isNaN(numericAmount)) {
    return numericAmount.toFixed(2);
  }

  return "—";
};

export const formatDate = (date: string): string => format(new Date(date), "dd/MM/yyyy, HH:mm:ss")
