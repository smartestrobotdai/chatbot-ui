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
  memoryType: string,
  key: string,
  serviceId: string|null,
  clientId: string|null,
  query: string,
  googleAPIKey:string|null = null, 
  googleCSEId:string|null=null
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
  console.log('MemoryType', memoryType)
  console.log('googleAPIKey', googleAPIKey)
  console.log('googleCSEId', googleCSEId)
  // print the first 100 characters of the query
  console.log('query (first 100 characters):', query.substring(0,100))
  if (firstMesaage && !shared) {
    // update the service if the conversation is not shared and this is the first message
    console.log('The first message, update the service')
    const url = `${OPENAI_API_HOST}/v1/services/${serviceId}?client_id=${clientId}`;
    const payload = JSON.stringify({model: model.id, "embedding_model": 
      embeddingModel.id, prompt,
      temperature, "memory_type": memoryType})
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    })

    if (response.status !== 200) {
      const errorText = await response.text();
      console.error(
        `OpenAI API returned an error ${
          response.status
        }: ${errorText}`,
      );
      
      throw ({statusCode: response.status, statusText: errorText});
    }
  }

  let url = `${OPENAI_API_HOST}/v1/services/${serviceId}/clients/${clientId}/chat`;
  if (googleAPIKey && googleCSEId) {
    url += '?search_enabled=true'
  }
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
      ...(googleAPIKey && {
        'Google-Api-Key': googleAPIKey!
      }),
      ...(googleCSEId && {
        'Google-Cse-Id': googleCSEId!
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      query
    }),
  })
  console.log('url', url)
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (res.status !== 200) {
    console.log('status: ', res.status)
    const result = await res.json();
    throw {statusCode: res.status, statusText: result.message || `${JSON.stringify(result)}`};
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
