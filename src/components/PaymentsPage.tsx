import React, { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query'
import { Container } from './components.tsx'
import { I18N } from "../constants/i18n";
import { API_URL, CURRENCIES } from "../constants/";
import { formatAmount, formatDate } from "../utils/formatters";
import { ErrorStatus, SearchCurrency } from "../types/payment"
import { Title, SearchInput, SearchButton, ClearButton, TableWrapper, Table, TableBodyWrapper, TableHeaderWrapper, TableHeaderRow, TableHeader, TableRow, TableCell, StatusBadge, ErrorBox, Select, PaginationButtonPrev, PaginationButtonNext } from "../components/components";

export const PaymentsPage = () => {
  const [searchInputValue, setSearchInputValue] = useState<string>('');
  const [searchQueryValue, setSearchQueryValue] = useState<string>('');
  const [searchCurrencyValue, setSearchCurrencyValue] = useState<SearchCurrency>('');
  const [searchPageValue, setSearchPageValue] = useState<number>(1);
  const [isErrorStatus, setIsErrorStatus] = useState<ErrorStatus | null>(null);
  const { data, refetch, isPending, error } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetch(`${API_URL}?search=${searchQueryValue}&currency=${searchCurrencyValue}&page=${searchPageValue}&pageSize=5`).then(async r => {
      // Realy fighting with react-query error handling
      // Doesn't seem to behave as described, but I'm new to it.
      // This will do:
      setIsErrorStatus(null);
      if (r.status !== 200) {
        setIsErrorStatus(r.status);
        return null;
      }

      return r.json();
    }),
  })

  useEffect(() => {
    console.log(data)
  }, [data]);

  useEffect(() => {
    refetch();
  }, [searchQueryValue, searchCurrencyValue, searchPageValue, refetch]);

  return <Container>
    <Title>All Payments</Title>
    <SearchInput
      name="search"
      role="searchbox"
      placeholder={I18N.SEARCH_PLACEHOLDER}
      onChange={e => setSearchInputValue(e.target.value)}
      value={searchInputValue}
    />
    <Select
      name="currencies"
      aria-label={I18N.CURRENCY_FILTER_LABEL}
      onChange={e => setSearchCurrencyValue(e.target.value)}
      role="combobox"
    >
      <option value="">{I18N.EMPTY_CURRENCY}</option>
      {CURRENCIES.map(currency =>
        <option
          key={currency}
          value={currency}
        >
          {currency}
        </option>
      )}
    </Select>
    <SearchButton
      onClick={() => setSearchQueryValue(searchInputValue)}
    >
      {I18N.SEARCH_BUTTON}
    </SearchButton>
    {searchQueryValue && (
      <ClearButton
        onClick={() => {
          setSearchInputValue('');
          setSearchQueryValue('');
        }}
      >
        {I18N.CLEAR_FILTERS}
      </ClearButton>
    )}
    { isErrorStatus ? (
      <ErrorBox>{
        isErrorStatus === 404 ?
          I18N.PAYMENT_NOT_FOUND
        : isErrorStatus === 500 ?
          I18N.INTERNAL_SERVER_ERROR
        : I18N.SOMETHING_WENT_WRONG
      }</ErrorBox>
    )
    : error && (
      <ErrorBox>Error: {error.message}</ErrorBox>
    )}
    {isPending ? (
      <div>Loading...</div>
    ) : data?.payments && (
      <TableWrapper>
        <Table>
          <TableHeaderWrapper>
            <TableHeaderRow>
              <TableHeader>{I18N.TABLE_HEADER_PAYMENT_ID}</TableHeader>
              <TableHeader>{I18N.TABLE_HEADER_DATE}</TableHeader>
              <TableHeader>{I18N.TABLE_HEADER_AMOUNT}</TableHeader>
              <TableHeader>{I18N.TABLE_HEADER_CUSTOMER}</TableHeader>
              <TableHeader>{I18N.TABLE_HEADER_CURRENCY}</TableHeader>
              <TableHeader>{I18N.TABLE_HEADER_STATUS}</TableHeader>
            </TableHeaderRow>
          </TableHeaderWrapper>
          <TableBodyWrapper>
            {data.payments.map(row => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{formatDate(row.date)}</TableCell>
                <TableCell>{formatAmount(row.amount)}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>
                  <StatusBadge status={row.status}>{row.status}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <PaginationButtonPrev
                  onClick={() => setSearchPageValue(searchPageValue - 1)}
                  disabled={searchPageValue === 1}
                >
                  {I18N.PREVIOUS_BUTTON}
                </PaginationButtonPrev>
              </TableCell>
              <TableCell
                colSpan={4}
                align="center"
              >
                {`${I18N.PAGE_LABEL} ${searchPageValue}`}
              </TableCell>
              <TableCell>
                <PaginationButtonNext
                  onClick={() => setSearchPageValue(searchPageValue + 1)}
                >
                  {I18N.NEXT_BUTTON}
                </PaginationButtonNext>

              </TableCell>
            </TableRow>
          </TableBodyWrapper>
        </Table>
      </TableWrapper>
    )}
  </Container>;
};
