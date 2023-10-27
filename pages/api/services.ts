import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { Conversation } from '@/types/chat';

export const config = {
  runtime: 'edge',
};




const handler = async (req: Request): Promise<Response> => {
  try {
    let body = null
    let isPost = false
    if (req.method === 'POST') {
      body = await req.json()
      isPost = true
    }
    
    console.log('body', body)
    const url = `${OPENAI_API_HOST}/v1/services`;
    console.log('req', req)
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
