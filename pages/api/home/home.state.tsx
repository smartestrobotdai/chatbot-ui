import { Conversation, MultimodalMessage } from '@/types/chat';
import { ErrorMessage } from '@/types/error';
import { FolderInterface } from '@/types/folder';
import { MemoryType } from '@/types/memoryType';
import { OpenAIModel, OpenAIModelID } from '@/types/openai';
import { PluginKey } from '@/types/plugin';
import { Prompt } from '@/types/prompt';
import { Tool } from '@/types/tool';

export interface HomeInitialState {
  apiKey: string;
  azureApiKey: string;
  pluginKeys: PluginKey[];
  loading: boolean;
  lightMode: 'light' | 'dark';
  messageIsStreaming: boolean;
  modelError: ErrorMessage | null;
  models: OpenAIModel[];
  tools: Tool[];
  folders: FolderInterface[];
  conversations: Conversation[];
  selectedConversation: Conversation | undefined;
  currentMessage: MultimodalMessage | undefined;
  prompts: Prompt[];
  temperature: number;
  showChatbar: boolean;
  showPromptbar: boolean;
  currentFolder: FolderInterface | undefined;
  messageError: boolean;
  enableOpenAI: boolean;
  enableAzureOpenAI: boolean;
  password: string;
  searchTerm: string;
  defaultModelId: OpenAIModelID | undefined;
  defaultEmbeddingModelId: OpenAIModelID | undefined;
  defaultMemoryType: MemoryType | undefined;
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
}

export const initialState: HomeInitialState = {
  apiKey: '',
  azureApiKey: '',
  loading: false,
  pluginKeys: [],
  lightMode: 'dark',
  messageIsStreaming: false,
  modelError: null,
  models: [],
  tools: [],
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [],
  temperature: 1,
  showPromptbar: true,
  showChatbar: true,
  currentFolder: undefined,
  messageError: false,
  enableOpenAI: true,
  enableAzureOpenAI: true,
  password: '',
  searchTerm: '',
  defaultModelId: undefined,
  defaultEmbeddingModelId: undefined,
  defaultMemoryType: undefined,
  serverSideApiKeyIsSet: false,
  serverSidePluginKeysSet: false,
};
