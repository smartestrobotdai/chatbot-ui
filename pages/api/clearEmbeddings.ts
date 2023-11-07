import { OPENAI_API_HOST } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
};


const handler = async (req: Request): Promise<Response> => {
  try {
    console.log('clear embeddings')

    const requestUrl = new URL(req.url)
    const serviceId = requestUrl.searchParams.get('serviceId');


    let url = `${OPENAI_API_HOST}/v1/services/${serviceId}/embeddings`
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const json_resp = await response.json();
      return new Response(JSON.stringify(json_resp), { status: response.status });
    } else {
      return new Response(JSON.stringify({}), { status: 200 });
    }
    
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify(error), { status: 500});
  }
};

export default handler;
