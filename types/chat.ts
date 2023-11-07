import { MemoryType } from './memoryType';
import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: OpenAIModel;
  embeddingModel: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
  temperature: number;
  memoryType: MemoryType;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
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
