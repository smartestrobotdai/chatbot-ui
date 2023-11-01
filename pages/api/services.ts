import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { Conversation } from '@/types/chat';

export const config = {
  runtime: 'edge',
};


const deleteHandler = async (req: Request): Promise<Response> => {
  try {
    console.log('deleting service')
    const requestUrl = new URL(req.url)
    const serviceId = requestUrl.searchParams.get('serviceId');
    const clientId = requestUrl.searchParams.get('clientId');
    if (!clientId) {
      return new Response('Error: clientId are empty', { status: 400 });
    }
    let url = `${OPENAI_API_HOST}/v1/services`
    if (serviceId) {
      // delete one services
      url += `/${serviceId}?clientId=${clientId}`
    } else {
      // delete all service
      url += `?clientId=${clientId}`
    }
    const response = await fetch(url, {
      method: 'DELETE',
    });
    return new Response(JSON.stringify({}), { status: 200 });
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
      url += `?clientId=${clientId}`
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
