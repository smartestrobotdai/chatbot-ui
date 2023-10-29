import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
import { M_PLUS_1 } from 'next/font/google';

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
    const { model, embeddingModel, temperature, messages, key, prompt } = (await req.json()) as ChatBody;
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

    const stream = await OpenAIStream(messages.length === 1, shared==='true', model, embeddingModel, prompt, temperature, key, serviceId, clientId, query);

    return new Response(stream as ReadableStream<any>);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
