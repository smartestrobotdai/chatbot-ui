import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE, DEFAULT_TOP_P } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { getClientId, getSettings } from '@/utils/app/settings';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderInterface, FolderType } from '@/types/folder';
import { OpenAIModelID, OpenAIModel, OpenAIModels, fallbackEmbeddingModelID, fallbackModelID } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

import { v4 as uuidv4 } from 'uuid';
import { MemoryType } from '@/types/memoryType';
import { ModelSelect } from '@/components/Chat/ModelSelect';

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
  defaultEmbeddingModelId: OpenAIModelID;
  defaultMemoryType: MemoryType;
  enableOpenAI: boolean;
  enableAzureOpenAI: boolean;
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
  defaultEmbeddingModelId,
  defaultMemoryType,
  enableOpenAI,
  enableAzureOpenAI
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels, getConversations } = useApiService();
  const { getModelsError } = useErrorService();
  
  
  let initialiatedConversation = false
  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      azureApiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
    },
    dispatch,
  } = contextValue;
  
  const stopConversationRef = useRef<boolean>(false);

  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      //if (!apiKey && !serverSideApiKeyIsSet) return null;

      return getModels(
        {
          key: apiKey,
        },
        signal,
      );
    },
    { enabled: true, refetchOnMount: false },
  );

  useEffect(() => {
    if (data) dispatch({ field: 'models', value: data });
  }, [data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) });
  }, [dispatch, error, getModelsError]);

  // FETCH MODELS ----------------------------------------------


  const { data: data2, error: error2, refetch: refetch2 } = useQuery(
    ['GetConversations', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      //if (!apiKey && !serverSideApiKeyIsSet) return null;

      return getConversations(
        {
          key: apiKey,
        },
        signal,
      );
    },
    { enabled: true, refetchOnMount: false },
  );
  
  const combineConversations = (conv1: Conversation[], conv2Raw: any) => {
    function getEnumKeyByValue(value: string): keyof typeof OpenAIModelID | undefined {
      return Object.keys(OpenAIModelID).find(key => OpenAIModelID[key as keyof typeof OpenAIModelID] === value) as keyof typeof OpenAIModelID | undefined;
    }

    const conv2:Conversation[] = conv2Raw.map((convRaw: any) => {
      console.log('convRaw', convRaw)
      const modelIdStr = convRaw['model'] as unknown as string
      const embeddingModelIdStr = convRaw['embedding_model'] as unknown as string
      const temperature = Number(convRaw.temperature as unknown as string);
      const topP = Number(convRaw.top_p as unknown as string);
      const folderId = convRaw['shared'] === 'True' ? 'predefined-conversations' : null
      const id = convRaw['id']
      const name = convRaw['name']
      const messages = convRaw['messages']
      const files = convRaw['files']
      const shared = convRaw['shared'] === 'True'
      const getModel = (modelIdStr: string) => {
        const model_key = getEnumKeyByValue(modelIdStr);
        if (model_key) {
          const modelId = OpenAIModelID[model_key]
          return {
            id: OpenAIModels[modelId].id,
            name: OpenAIModels[modelId].name,
            maxLength: OpenAIModels[modelId].maxLength,
            tokenLimit: OpenAIModels[modelId].tokenLimit,
            type: OpenAIModels[modelId].type
          } as OpenAIModel
        } else {
          return {
            id: modelIdStr,
            name: modelIdStr.toUpperCase(),
            maxLength: 12000,
            tokenLimit: 2000,
            type: convRaw['type']
          } as OpenAIModel
        }
      }
      const model = getModel(modelIdStr)
      const embeddingModel = getModel(embeddingModelIdStr)
      return {id, name, model, embeddingModel, temperature, topP, folderId, messages, files, shared}
    })

    const combined = [...conv1, ...conv2]
    const unique = combined.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
    return unique
  }

  useEffect(() => {
    console.log('data2 changed', data2)
    console.log('current conversation:', conversations)
    if (data2) dispatch({ field: 'conversations', value: combineConversations(conversations, data2)});
  }, [data2, dispatch]);

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    console.log('handleCreateFolder', name, type)
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });

    dispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });

    dispatch({ field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    dispatch({ field: 'folders', value: updatedFolders });

    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = async () => {
    const lastConversation = conversations[conversations.length - 1];

    // TODO: send the request to the server and get the conversation id
    dispatch({ field: 'loading', value: true });
    const endpoint = `api/services?client_id=${getClientId()}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({name: 'New Conversation',
         model: defaultModelId, 
         embeddingModel: defaultEmbeddingModelId}),
    })
    const data = await response.json()
    console.log('data:', data)
    const conversationId = data.service_id
    console.log('defaultModelId', defaultModelId)
    console.log('defaultEmbeddingModelId', defaultEmbeddingModelId)
    console.log('defaultMemoryType', defaultMemoryType)
    const newConversation: Conversation = {
      id: conversationId,
      name: t('New Conversation'),
      messages: [],
      files: [],
      model: lastConversation?.model || {
        id: defaultModelId,
        name: defaultModelId.toUpperCase(),
        maxLength: 10000,
        tokenLimit: 4096,
      },

      embeddingModel: lastConversation?.embeddingModel || {
        id: defaultEmbeddingModelId,
        name: defaultEmbeddingModelId.toUpperCase(),
        maxLength: 10000,
        tokenLimit: 4096,
      },

      memoryType: defaultMemoryType,
      topP: lastConversation?.topP ?? Number(DEFAULT_TOP_P),
      prompt: DEFAULT_SYSTEM_PROMPT,
      // convert the string to number of temperature

      temperature: lastConversation?.temperature ?? Number(DEFAULT_TEMPERATURE),
      folderId: null,
      shared: false
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: 'loading', value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };



    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    console.log('single', single)
    console.log("Before:", selectedConversation);
    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
    console.log("After:", selectedConversation);
  };
  
  const handleUpdateConversationMultiple = (
    conversation: Conversation,
    updates: Array<KeyValuePair>
  ) => {
    let updatedConversation = { ...conversation };
  
    updates.forEach(data => {
      updatedConversation = {
        ...updatedConversation,
        [data.key]: data.value,
      };
    });
  
    const { single, all } = updateConversation(
      updatedConversation,
      conversations
    );
  
    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };
  
  
  // EFFECTS  --------------------------------------------
  useEffect(() => {
    
    dispatch({ field: 'enableOpenAI', value: enableOpenAI });
  }, [enableOpenAI, dispatch]);

  useEffect(() => {
    
    dispatch({ field: 'enableAzureOpenAI', value: enableAzureOpenAI });
  }, [enableAzureOpenAI, dispatch]);

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: 'defaultModelId', value: defaultModelId });
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    console.log("useEffect ran due to:", { 
      defaultModelId, 
      dispatch,
      serverSideApiKeyIsSet, 
      serverSidePluginKeysSet 
    });
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }

    const apiKey = localStorage.getItem('apiKey');

    if (serverSideApiKeyIsSet) {
      dispatch({ field: 'apiKey', value: '' });

      localStorage.removeItem('apiKey');
    } else if (apiKey) {
      dispatch({ field: 'apiKey', value: apiKey });
    }

    const azureApiKey = localStorage.getItem('azureApiKey');

    if (azureApiKey) {
      dispatch({ field: 'azureApiKey', value: azureApiKey });
    }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      dispatch({ field: 'pluginKeys', value: JSON.parse(pluginKeys) });
    }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }
    
    const foldersStorage = localStorage.getItem('folders');
    // check if foldersStorage contains predefined-conversations
    // if not, add it
    const foldersStorageParsed: FolderInterface[] = foldersStorage?JSON.parse(foldersStorage):[]
    const predefinedFolder: FolderInterface = {id: 'predefined-conversations', name: 'Shared conversations', type: 'chat'}
    if (!foldersStorageParsed.find((folder) => folder.id === 'predefined-conversations')) {
      foldersStorageParsed.push(predefinedFolder)
      localStorage.setItem('folders', JSON.stringify(foldersStorageParsed));
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) });
    }

    const prompts = localStorage.getItem('prompts');
    if (prompts) {
      dispatch({ field: 'prompts', value: JSON.parse(prompts) });
    }

    console.log('preparing to load conversations from storage')
    console.log('conversations:', conversations)
    const conversationHistory = localStorage.getItem('conversationHistory');
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory);
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      );
      
      console.log('cleanedConversationHistory:', cleanedConversationHistory)
      dispatch({ field: 'conversations', value: cleanedConversationHistory });
    }

    const selectedConversation = localStorage.getItem('selectedConversation');
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      });
    } else {
      
      console.log('conversations', conversations)
      if (conversations.length > 0) {
        console.log('conversations.length > 0')
        dispatch({
          field: 'selectedConversation',
          value: conversations[conversations.length - 1],
        });
      } else {
        if (!initialiatedConversation) {
          handleNewConversation()
          initialiatedConversation = true
        }
      }

      // const lastConversation = conversations[conversations.length - 1];
      // dispatch({
      //   field: 'selectedConversation',
      //   value: {
      //     id: uuidv4(),
      //     name: t('New Conversation'),
      //     messages: [],
      //     model: OpenAIModels[defaultModelId],
      //     prompt: DEFAULT_SYSTEM_PROMPT,
      //     temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      //     folderId: null,
      //   },
      // });
    }
  }, [
    defaultModelId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ])

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
        handleUpdateConversationMultiple
      }}
    >
      <Head>
        <title>Chatbot UI</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />

            <div className="flex flex-1">
              <Chat stopConversationRef={stopConversationRef} />
            </div>

            <Promptbar />
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const enableOpenAI = process.env.ENABLE_OPENAI === undefined || process.env.ENABLE_OPENAI === 'true'
  const enableAzureOpenAI = process.env.ENABLE_AZURE_OPENAI === undefined || process.env.ENABLE_AZURE_OPENAI === 'true'

  const defaultModelId =
    process.env.DEFAULT_MODEL ||
    fallbackModelID;

  const defaultEmbeddingModelId =
    process.env.DEFAULT_EMBEDDING_MODEL ||
      fallbackEmbeddingModelID;

  const defaultMemoryType = process.env.DEFAULT_MEMORY_TYPE || MemoryType.MEMORY_SUMMARIZER
  console.log('getServerSideProps', defaultModelId, defaultEmbeddingModelId, defaultMemoryType, enableOpenAI, enableAzureOpenAI)
  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultModelId,
      defaultEmbeddingModelId,
      defaultMemoryType,
      serverSidePluginKeysSet,
      enableOpenAI,
      enableAzureOpenAI,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  };
};
