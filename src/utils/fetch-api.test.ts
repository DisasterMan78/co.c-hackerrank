import {http, HttpResponse} from 'msw'
import '@testing-library/jest-dom'

import { FetchApiOnClient } from './fetch-api';
import { waitFor } from '@testing-library/dom';
import { API_URL } from '../constants/'
import { server, testAPIResponse } from '../mocks/fetch-api.mock';

describe('api fetch tests', () => {
  it('receives data from API on success', async () => {
    const result = await FetchApiOnClient(API_URL)

    await waitFor(
      () => expect(result).toEqual(testAPIResponse)
    )
  })

  it('handles server error', async () => {
    server.use(
      http.get(API_URL, () => {
        return new HttpResponse(null, {status: 500})
      }),
    )

    await FetchApiOnClient(API_URL)
      .catch(error => {
        expect(error.message).toEqual('Failed to fetch data: 500 - Internal Server Error')
      })
  })
})
