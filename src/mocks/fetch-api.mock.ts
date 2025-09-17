import { http, HttpResponse } from 'msw'
import { setupServer } from "msw/node";
import { API_URL } from "../constants";

export const testAPIResponse = {
  "payments": [
    {
      "id": "pay_123456789",
      "customerName": "John Doe",
      "amount": 150.00,
      "customerAddress": "123 Main St, City, Country",
      "currency": "USD",
      "status": "completed",
      "date": "2024-01-15T10:30:00Z",
      "description": "Payment for services",
      "clientId": "cli_123"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 5
}

export const server = setupServer(
  http.get(API_URL, async () => HttpResponse.json(testAPIResponse)),
)

beforeAll(() => server.listen({
  onUnhandledRequest: (req) => console.error(`No handler for ${req.url}`),
}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
