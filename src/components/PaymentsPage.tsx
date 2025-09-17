import React from "react";
import { useQuery } from '@tanstack/react-query'
import { Container } from './components.tsx'
import { I18N } from "../constants/i18n";
import { API_URL } from "../constants/";
import { formatAmount, formatDate } from "../utils/formatters"
import { TableWrapper, Table, TableBodyWrapper, TableHeaderWrapper, TableHeaderRow, TableHeader, TableRow, TableCell, StatusBadge } from "../components/components"

export const PaymentsPage = () => {
  const { data, isPending, error } = useQuery({
    queryKey: ['payments'],
    queryFn: () => fetch(`${API_URL}?&page=1&pageSize=5`).then(r => r.json()),
  })

  return <Container>
    {isPending ? (
      <div>Loading...</div>
    ) : error ? (
      <div>Error: {error.message}</div>
    ) : (
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
          </TableBodyWrapper>
        </Table>
      </TableWrapper>
      )}
  </Container>;
};
