import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';


export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  firstMesaage: boolean,
  shared: boolean,
  model: OpenAIModel,
  embeddingModel: OpenAIModel,
  prompt: string, 
  temperature: number, 
  key: string,
  serviceId: string|null,
  clientId: string|null,
  query: string,
) => {
  // printout all input parameters:
  console.log('firstMesaage', firstMesaage)
  console.log('shared', shared)
  console.log('model', model)
  console.log('embeddingModel', embeddingModel)
  console.log('prompt', prompt)
  console.log('temperature', temperature)
  console.log('key', key)
  console.log('serviceId', serviceId)
  console.log('clientId', clientId)
  console.log('query', query)


  if (firstMesaage && !shared) {
    // update the service if the conversation is not shared and this is the first message
    console.log('The first message, update the service')
    const url = `${OPENAI_API_HOST}/v1/services/${serviceId}?clientId=${clientId}`;
    const payload = JSON.stringify({model: model.id, "embedding-model": embeddingModel.id, prompt, temperature})
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    })
    console.log('response', response)
    if (response.status === 401) {
      return new Response(response.body, {
        status: 401,
        headers: response.headers,
      });
    } else if (response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${
          response.status
        }: ${await response.text()}`,
      );
      throw new Error('OpenAI API returned an error');
    }
  }

  let url = `${OPENAI_API_HOST}/v1/services/${serviceId}/clients/${clientId}/chat`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      query
    }),
  });
  console.log('url', url)
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    console.log('status: ', res.status)
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }
  console.log('Readable:', ReadableStream.toString());
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      for await (const chunk of res.body as any) {
        
        buffer += decoder.decode(chunk);
        
        if (buffer.trim().endsWith("}")) {
          //buffer = buffer.replace(/\n/g, '');
          buffer = buffer.replace(/data: /g, '');

          
          const regex = /"content":\s*"((?:\\"|[^"])*)"/g;

          let match;
          
          
          while ((match = regex.exec(buffer)) !== null) {
            controller.enqueue(encoder.encode(match[1]));
          }
          
          buffer = "";
        }
      }
      console.log('closed')
      controller.close();
    },
  });

  console.log('stream returned from OpenAIStream', stream)
  return stream;
};
