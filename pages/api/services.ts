import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
};


const deleteHandler = async (req: Request): Promise<Response> => {
  try {
    console.log('deleting service')
    const requestUrl = new URL(req.url)
    const serviceId = requestUrl.searchParams.get('serviceId');
    const clientId = requestUrl.searchParams.get('client_id');
    if (!clientId) {
      return new Response('Error: clientId are empty', { status: 400 });
    }
    let url = `${OPENAI_API_HOST}/v1/services`
    if (serviceId) {
      // delete one services
      url += `/${serviceId}?client_id=${clientId}`
    } else {
      // delete all service
      url += `?client_id=${clientId}`
    }
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const json_resp = await response.json();
      return new Response(JSON.stringify(json_resp), { status: response.status });
    } else {
      return new Response(JSON.stringify({}), { status: 200 });
    }
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'DELETE') {
    return deleteHandler(req)
  }
  try {
    let body = null
    let isPost = false
    if (req.method === 'POST') {
      body = await req.json()
      isPost = true
    }
    
    console.log('body', body)
    let url = `${OPENAI_API_HOST}/v1/services`;
    const requestUrl = new URL(req.url)
    const clientId = requestUrl.searchParams.get('clientId');
    if (clientId) {
      url += `?client_id=${clientId}`
    }
    // Forward the request to your Python backend
    const pythonBackendResponse = await fetch(url, {
      method: req.method,
      body: isPost ? JSON.stringify(body) : null,
      headers: {'Content-Type': 'application/json'},
    });

    // Get the response from your Python backend
    const data = await pythonBackendResponse.json();

    // Return the response back to the frontend

    return new Response(JSON.stringify(data), {status: 200});

  } catch (error) {
    console.error(error);
    return new Response('Error', {status: 500});
  }

};

export default handler;
