import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { Conversation } from '@/types/chat';

export const config = {
  runtime: 'edge',
};


const deleteHandler = async (req: Request): Promise<Response> => {
  try {
    console.log('deleting history')
    const requestUrl = new URL(req.url)
    const serviceId = requestUrl.searchParams.get('serviceId');
    const clientId = requestUrl.searchParams.get('clientId');
    if (!clientId) {
      return new Response('Error: clientId are empty', { status: 400 });
    }
    if (!serviceId) {
      return new Response('Error: serviceId are empty', { status: 400 });
    }
    let url = `${OPENAI_API_HOST}/v1/services/${serviceId}/clients/${clientId}/history`
    const response = await fetch(url, {
      method: 'DELETE',
    });

    const body = await response.text();

    // return the message in the response
    if (response.ok) {
      return new Response(body, { status: 200 });
    } else {
      return new Response(body, { status: response.status });
    }
    
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
}

const handler = async (req: Request): Promise<Response> => {
  return deleteHandler(req)
};

export default handler;
