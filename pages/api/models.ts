import { OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';
import { LLM_PROXY_HOST } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    
    const { key } = (await req.json()) as {
      key: string;
    };

    let url = `${LLM_PROXY_HOST}/v1/models`;
    console.log('sending request to openai', url)
    if (OPENAI_API_TYPE === 'azure') {
      url = `${LLM_PROXY_HOST}/openai/deployments?api-version=${OPENAI_API_VERSION}`;
    }

    const response = await fetch(url, {
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
    });

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      });
    } else if (response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${response.status
        }: ${await response.text()}`,
      );
      throw new Error('OpenAI API returned an error');
    }
    console.log('statusCode from openai', response.status)
    let models = await response.json();
    console.log('models from openai', models)

    return new Response(JSON.stringify(models), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
