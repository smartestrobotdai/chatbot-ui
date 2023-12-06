


import { cleanSourceText } from '@/utils/server/google';

import { GoogleBody, GoogleSource } from '@/types/google';

//import { Readability } from '@mozilla/readability';
import endent from 'endent';
//import jsdom, { JSDOM } from 'jsdom';
import { OpenAIStream } from '@/utils/server';
import { getText } from '@/types/chat';



export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { messages, key, model, prompt, embeddingModel, temperature, topP, memoryType,
        googleAPIKey, googleCSEId } =
      await req.json() as GoogleBody;
    console.log('messages', messages)
    const userMessage = messages[messages.length - 1];
    const text = getText(userMessage) || '';
    const query = encodeURIComponent(text.trim());

    const requestUrl = new URL(req.url!, `http://${req.headers.get('host')}`);
    const serviceId = requestUrl.searchParams.get('serviceId');
    const clientId = requestUrl.searchParams.get('clientId');
    const shared = requestUrl.searchParams.get('shared');
    const stream = await OpenAIStream(messages.length === 1, shared==='true', 
      model, embeddingModel, prompt, temperature, topP, memoryType, key, serviceId, clientId, 
      query, googleAPIKey, googleCSEId);

    return new Response(stream as ReadableStream<any>);
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify(error), { status: error.statusCode })
  }
}

export default handler;
