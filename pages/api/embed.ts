import { Readable } from 'stream';

import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
}

// Helper function to convert a stream to a buffer
const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const handler = async (req: Request): Promise<Response> => {
  try {
    console.log('embed file')
    const requestUrl = new URL(req.url)
    const serviceId = requestUrl.searchParams.get('serviceId');
    const clientId = requestUrl.searchParams.get('clientId');
    if (!clientId) {
      return new Response('Error: clientId are empty', { status: 400 });
    }
    if (!serviceId) {
      return new Response('Error: serviceId are empty', { status: 400 });
    }
    let url = `${OPENAI_API_HOST}/v1/services/${serviceId}/embed_file?clientId=${clientId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('Content-Type') || '',
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: req.body
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
};

export default handler;
