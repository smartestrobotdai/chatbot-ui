import { OPENAI_API_HOST } from '@/utils/app/const';


export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    let url = `${OPENAI_API_HOST}/v1/tools`;

    console.log(`Sending request to ${url}...`)
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
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

    //const ENABLE_OPENAI = process.env.ENABLE_OPENAI === undefined || process.env.ENABLE_OPENAI === 'true'
    const json = await response.json();
    const tools = json.data.map((tool: any) => ({name: tool.name, 
      description: tool.description}));


    return new Response(JSON.stringify(tools), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
