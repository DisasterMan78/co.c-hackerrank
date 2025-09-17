import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "vitest";
import { server } from "./mocks/node";
import App from "./App";
import { I18N } from "./constants/i18n";
import { format } from 'date-fns';

// Helper function to robustly check for error messages with better debugging
export const waitForErrorMessage = async (expectedMessage: string, timeout = 10000) => {
  try {
    await waitFor(() => {
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    }, { timeout });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // If the expected message isn't found, let's see what error messages are actually on the page
    const errorElements = screen.queryAllByText(/error|not found|server/i);
    const errorTexts = errorElements.map(el => el.textContent).filter(Boolean);

    throw new Error(
      `Expected error message "${expectedMessage}" not found. ` +
      `Available error-related text: ${errorTexts.join(', ') || 'None found'}`
    );
  }
};

export const getTableCellsByColumnName = (columnName: string, rowIndex: number) => {
  const headers = screen.getAllByRole('columnheader');

  const columnIndex = headers.findIndex((header) =>
    (header?.textContent || '').includes(columnName),
  );

  if (columnIndex === -1) {
    throw new Error(`Column name not found`);
  }

  const rows = screen.getAllByRole('row').slice(1);

  if (rowIndex !== null) {
    const cells = rows[rowIndex]?.querySelectorAll('td');
    return cells?.[columnIndex];
  } else {
    throw new Error(`Row not found`);
  }
};


export const formattedDate = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy, HH:mm:ss")
};

export const getSearchInput = () => {
  // Try to find by placeholder first, then by role with name
  try {
    return screen.getByPlaceholderText(I18N.SEARCH_PLACEHOLDER);
  } catch {
    return screen.getByRole("searchbox", { name: I18N.SEARCH_LABEL });
  }
};

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("App - Step 1: Basic Payment List", () => {
  test("should fetch and display payments in a table with page=1 and pageSize=5", async () => {
    render(<App />);

    // Wait for the table to load with data cells
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
    });

    // Check that table headers are displayed using i18n strings
    expect(screen.getByText(I18N.TABLE_HEADER_PAYMENT_ID)).toBeInTheDocument();
    expect(screen.getByText(I18N.TABLE_HEADER_DATE)).toBeInTheDocument();
    expect(screen.getByText(I18N.TABLE_HEADER_AMOUNT)).toBeInTheDocument();
    expect(screen.getByText(I18N.TABLE_HEADER_CUSTOMER)).toBeInTheDocument();
    expect(screen.getByText(I18N.TABLE_HEADER_CURRENCY)).toBeInTheDocument();
    expect(screen.getByText(I18N.TABLE_HEADER_STATUS)).toBeInTheDocument();

    // Check that 5 payments are displayed (pageSize=5)
    const tableRows = screen.getAllByRole("row");
    expect(tableRows).toHaveLength(6); // 1 header row + 5 data rows
  });

  test("should format amounts and dates using the formatters", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
    });

    // Check that amounts are formatted (should show decimal places)
    const amountCells = screen.getAllByText(/\d+\.\d{2}/);
    expect(amountCells.length).toBeGreaterThan(0);

    // Check that dates are formatted (should show dd/mm/yyyy format)
    const dateCells = screen.getAllByText(/\d{2}\/\d{2}\/\d{4}/);
    expect(dateCells.length).toBeGreaterThan(0);
  });
});

describe("App - Step 2: Search by Payment ID", () => {
  test("should have a search input for payment ID", () => {
    render(<App />);

    const searchInput = getSearchInput();
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute("placeholder", I18N.SEARCH_PLACEHOLDER);
  });

  test("should have a search button", () => {
    render(<App />);

    const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toHaveTextContent(I18N.SEARCH_BUTTON);
  });

  test("should search for payments by payment ID", async () => {
    // THIS IS A FALSE POSITIVE TEST!
    // With no search functionality built, the search button does nothing
    // "pay_134_1" is ALREADY in the table, so the test says it passes.
    render(<App />);

    const searchInput = getSearchInput();
    const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });

    fireEvent.change(searchInput, { target: { value: "pay_134_1" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("pay_134_1")).toBeInTheDocument();
      // Added a negative test to fix the false positive
      expect(screen.queryByText("pay_134_2")).not.toBeInTheDocument();
    });
  });
});

describe("App - Step 3: Clear Filters", () => {
  test("should show clear filters button when search is active", async () => {
    render(<App />);

    const searchInput = getSearchInput();
    const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });

    // Added to confirm button is NOT present before
    // search filter is active
    expect(screen.queryByRole("button", { name: I18N.CLEAR_FILTERS })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "pay_134_1" } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: I18N.CLEAR_FILTERS })).toBeInTheDocument();
    });
  });

  test("should clear all filters when clear button is clicked", async () => {
    render(<App />);

    const searchInput = getSearchInput();
    const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });

    // Perform a search
    fireEvent.change(searchInput, { target: { value: "pay_134_1" } });

    // Either the fireEvent and check for results is unnecessary, or there should be a check to see if
    // the results change AFTER clearing too - the spec is not entirely clear on the desired behaviour.
    // If the Clear button is supposed to also trigger a requery, there should be a negative check for
    // unwanted values while the filter is active as per the previous test followed by a check to see
    // they are returned after clearing the filter
    // I am going to assume that the Clear button should clear the input AND reset the results
    // as it is more complex and more fun to do.
    // Ordinarily I would confirm the desired behaviour with the project manager!

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("pay_134_1")).toBeInTheDocument();
      // Added a negative test to fix the false positive
      expect(screen.queryByText("pay_134_2")).not.toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByRole("button", { name: I18N.CLEAR_FILTERS });
    fireEvent.click(clearButton);

    // Check that search input is cleared
    expect(searchInput).toHaveValue("");

    await waitFor(() => {
      expect(screen.queryByText("pay_134_2")).toBeInTheDocument();
    });
  });
});

describe("App - Step 4: Handle Payment Not Found", () => {
  test("should display error message when payment ID is not found", async () => {
    render(<App />);

    const searchInput = getSearchInput();
    const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });

    fireEvent.change(searchInput, { target: { value: "pay_404" } });
    fireEvent.click(searchButton);

    await waitForErrorMessage(I18N.PAYMENT_NOT_FOUND);
  });
});

// describe("App - Step 5: Handle Server Error", () => {
//   test("should display error message when API returns 500", async () => {
//     render(<App />);

//     const searchInput = getSearchInput();
//     const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });

//     fireEvent.change(searchInput, { target: { value: "pay_500" } });
//     fireEvent.click(searchButton);

//     await waitForErrorMessage(I18N.INTERNAL_SERVER_ERROR);
//   });
// });

// describe("App - Step 6: Currency Filter", () => {
//   test("should have a currency filter dropdown", () => {
//     render(<App />);

//     const currencySelect = screen.getByRole("combobox", { name: I18N.CURRENCY_FILTER_LABEL });
//     expect(currencySelect).toBeInTheDocument();
//   });

//   test("should filter payments by currency when selected", async () => {
//     render(<App />);

//     const currencySelect = screen.getByRole("combobox", { name: I18N.CURRENCY_FILTER_LABEL });

//     fireEvent.change(currencySelect, { target: { value: "USD" } });

//     await waitFor(() => {
//       const usdPayments = screen.getAllByText("USD");
//       expect(usdPayments.length).toBeGreaterThan(0);
//     });
//   });

//   test("should show all currencies in dropdown options", () => {
//     render(<App />);

//     // Check that all currency options are available in the select element
//     expect(screen.getByRole("option", { name: "USD" })).toBeInTheDocument();
//     expect(screen.getByRole("option", { name: "EUR" })).toBeInTheDocument();
//     expect(screen.getByRole("option", { name: "GBP" })).toBeInTheDocument();
//     expect(screen.getByRole("option", { name: "AUD" })).toBeInTheDocument();
//     expect(screen.getByRole("option", { name: "CAD" })).toBeInTheDocument();
//     expect(screen.getByRole("option", { name: "ZAR" })).toBeInTheDocument();
//   });

//   test("should allow selecting currency options", () => {
//     render(<App />);

//     const currencySelect = screen.getByRole("combobox", { name: I18N.CURRENCY_FILTER_LABEL });

//     // Select USD option
//     fireEvent.change(currencySelect, { target: { value: "USD" } });
//     expect(currencySelect).toHaveValue("USD");

//     // Select EUR option
//     fireEvent.change(currencySelect, { target: { value: "EUR" } });
//     expect(currencySelect).toHaveValue("EUR");
//   });
// });

// describe("App - Step 7: Combined Currency and Payment ID Filter", () => {
//   test("should filter by both currency and payment ID", async () => {
//     render(<App />);

//     const searchInput = getSearchInput();
//     const searchButton = screen.getByRole("button", { name: I18N.SEARCH_BUTTON });
//     const currencySelect = screen.getByRole("combobox", { name: I18N.CURRENCY_FILTER_LABEL });

//     // Search for a specific payment
//     fireEvent.change(searchInput, { target: { value: "pay_134" } });
//     fireEvent.click(searchButton);

//     // Filter by currency
//     fireEvent.change(currencySelect, { target: { value: "USD" } });

//     await waitFor(() => {
//       // Should show payments that match both criteria
//       const usdPayments = screen.getAllByText("USD");
//       expect(usdPayments.length).toBeGreaterThan(0);
//     });
//   });
// });

// describe("App - Step 8: Pagination", () => {
//   test("should display pagination controls", async () => {
//     render(<App />);

//     await waitFor(() => {
//       expect(screen.getByRole("table")).toBeInTheDocument();
//       expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
//     });

//     // Check for pagination buttons
//     expect(screen.getByRole("button", { name: I18N.PREVIOUS_BUTTON })).toBeInTheDocument();
//     expect(screen.getByRole("button", { name: I18N.NEXT_BUTTON })).toBeInTheDocument();
//   });

//   test("should display current page number", async () => {
//     render(<App />);

//     await waitFor(() => {
//       expect(screen.getByRole("table")).toBeInTheDocument();
//       expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
//     });

//     // Check that page number is displayed
//     expect(screen.getByText(`${I18N.PAGE_LABEL} 1`)).toBeInTheDocument();
//   });

//   test("should disable previous button on first page", async () => {
//     render(<App />);

//     await waitFor(() => {
//       expect(screen.getByRole("table")).toBeInTheDocument();
//       expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
//     });

//     const previousButton = screen.getByRole("button", { name: I18N.PREVIOUS_BUTTON });
//     expect(previousButton).toBeDisabled();
//   });

//   test("should enable previous button after navigating to next page", async () => {
//     render(<App />);

//     await waitFor(() => {
//       expect(screen.getByRole("table")).toBeInTheDocument();
//       expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
//     });

//     const nextButton = screen.getByRole("button", { name: I18N.NEXT_BUTTON });
//     fireEvent.click(nextButton);

//     await waitFor(() => {
//       expect(screen.getByText(`${I18N.PAGE_LABEL} 2`)).toBeInTheDocument();
//     });

//     const previousButton = screen.getByRole("button", { name: I18N.PREVIOUS_BUTTON });
//     expect(previousButton).not.toBeDisabled();
//   });

//   test("should show different payments on next page", async () => {
//     render(<App />);

//     await waitFor(() => {
//       expect(screen.getByRole("table")).toBeInTheDocument();
//       expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
//     });

//     // Get first page payments
//     const firstPagePayments = screen.getAllByRole("row").slice(1); // Exclude header
//     const firstPagePaymentIds = firstPagePayments.map(row =>
//       row.querySelector('td')?.textContent
//     );

//     // Navigate to next page
//     const nextButton = screen.getByRole("button", { name: I18N.NEXT_BUTTON });
//     fireEvent.click(nextButton);

//     await waitFor(() => {
//       expect(screen.getByText(`${I18N.PAGE_LABEL} 2`)).toBeInTheDocument();
//     });

//     // Get second page payments
//     const secondPagePayments = screen.getAllByRole("row").slice(1); // Exclude header
//     const secondPagePaymentIds = secondPagePayments.map(row =>
//       row.querySelector('td')?.textContent
//     );

//     // Check that payments are different
//     expect(secondPagePaymentIds).not.toEqual(firstPagePaymentIds);
//   });

//   test("should navigate back to previous page", async () => {
//     render(<App />);

//     await waitFor(() => {
//       expect(screen.getByRole("table")).toBeInTheDocument();
//       expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
//     });

//     // Navigate to next page
//     const nextButton = screen.getByRole("button", { name: I18N.NEXT_BUTTON });
//     fireEvent.click(nextButton);

//     await waitFor(() => {
//       expect(screen.getByText(`${I18N.PAGE_LABEL} 2`)).toBeInTheDocument();
//     });

//     // Navigate back to previous page
//     const previousButton = screen.getByRole("button", { name: I18N.PREVIOUS_BUTTON });
//     fireEvent.click(previousButton);

//     await waitFor(() => {
//       expect(screen.getByText(`${I18N.PAGE_LABEL} 1`)).toBeInTheDocument();
//     });
//   });
// });
