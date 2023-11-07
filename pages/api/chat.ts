import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';

import { ChatBody } from '@/types/chat';


export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const requestUrl = new URL(req.url)
    const serviceId = requestUrl.searchParams.get('serviceId');
    const clientId = requestUrl.searchParams.get('clientId');
    const shared = requestUrl.searchParams.get('shared');
    if (!serviceId) {
      return new Response('Error', { status: 400 });
    }

    if (!clientId) {
      return new Response('Error', { status: 400 });
    }
    const { model, embeddingModel, temperature, messages, key, prompt, 
      memoryType } = 
      (await req.json()) as ChatBody;
    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }
    console.log('messages', messages)
    // get the last message
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content
    if (!query) {
      return new Response('Error', { status: 400 });
    }

    const stream = await OpenAIStream(messages.length === 1, shared==='true', 
      model, embeddingModel, prompt, temperature, memoryType, key, serviceId, clientId, query);
    return new Response(stream as ReadableStream<any>);
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify(error), { status: error.statusCode })
  }
};

export default handler;
