export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are a large language model. Follow the user's instructions carefully. Respond as much as you can.";

  export const DEFAULT_SYSTEM_PROMPT_IMAGE =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_IMAGE ||
  "You are a large image model. Answer questions about the image if it is present.";



export const DEFAULT_TOP_P = 
  process.env.DEFAULT_TOP_P || "1";

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_TEMPERATURE = 
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "1");

export const OPENAI_API_TYPE =
  process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-03-15-preview';

export const OPENAI_ORGANIZATION =
  process.env.OPENAI_ORGANIZATION || '';

export const AZURE_DEPLOYMENT_ID =
  process.env.AZURE_DEPLOYMENT_ID || '';

// if ENABLE_OPENAI is set and is true, then enable openai, 
// if ENABLE_OPENAI is not set, then enable openai
export const ENABLE_OPENAI = process.env.ENABLE_OPENAI === undefined || process.env.ENABLE_OPENAI === 'true'
