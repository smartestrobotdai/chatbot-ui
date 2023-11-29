import { Roboto_Flex } from 'next/font/google';
import { MemoryType } from './memoryType';
import { OpenAIModel } from './openai';

export interface ContentElement {
  type: 'text' | 'image';
  text?: string;
  image_url?: {
    url: string;
  }
}

export interface MultimodalMessage {
  role: Role;
  content: ContentElement[]|string;
}


export const getText = (message: MultimodalMessage) => {
  // check message.content is a string
  if (typeof message.content === 'string') {
    return message.content
  } else {
    const textContents =  message.content.filter((element) => element.type === 'text')
    return textContents.length > 0 ? textContents[0].text : '';
  }
}

export const getImage = (message: MultimodalMessage) => {
  if (typeof message.content === 'string') {
    return null
  }
  const imageContents =  message.content.filter((element) => element.type === 'image')
  return imageContents.length > 0 ? imageContents[0].image_url?.url : null;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  embeddingModel: OpenAIModel;
  messages: MultimodalMessage[];
  key: string;
  prompt: string;
  temperature: number;
  topP: number;
  memoryType: MemoryType;
}

export interface Conversation {
  id: string;
  name: string;
  messages: MultimodalMessage[];
  model: OpenAIModel;
  embeddingModel: OpenAIModel;
  prompt: string;
  temperature: number;
  topP: number;
  folderId: string | null;
  shared: boolean;
  files: string[];
  memoryType: MemoryType;
}
