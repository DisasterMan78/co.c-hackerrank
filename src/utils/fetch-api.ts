// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FetchApiOnClient = async (apiURL: string, payload: {[key: string]: any}) => {
  let responseData;
  try {
    const response = await fetch(apiURL, {
      method:'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch data: ${response.status} - ${response.statusText}`);
    }

    responseData = await response.json();
  } catch (error) {
    return Promise.reject(error as Error);
  }

  return responseData;
}

export default FetchApiOnClient
