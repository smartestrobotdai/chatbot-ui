import { IconCircleX, IconClearAll, IconExclamationCircle, IconSettings, IconUserExclamation } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, MultimodalMessage, getText } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { Slider } from './Slider';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { getClientId } from '@/utils/app/settings';
import FormData from 'form-data';
import { EmbeddedFiles } from './EmbeddedFiles';
import { MemoryTypeSelect } from './MemoryTypeSelect';
import { OpenAIModel } from '@/types/openai';
import { AllowedToolSelector } from './AllowedToolSelector'; 
import { OPENAI_API_HOST } from '@/utils/app/const';


interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      tools,
      apiKey,
      azureApiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<MultimodalMessage>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  
  const [selectedModel, setSelectedModel] = useState<OpenAIModel | null>(null);
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState<OpenAIModel | null>(null);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateService = async (serviceId: string, clientId: string) => {
    const urlService = `api/services?serviceId=${serviceId}&clientId=${clientId}`;
    const payload = JSON.stringify({model: selectedConversation?.model.id, "embedding_model": 
      selectedConversation?.embeddingModel.id, 
      prompt: selectedConversation?.prompt,
      temperature: selectedConversation?.temperature,
      "top_p": selectedConversation?.topP,
      "memory_type": selectedConversation?.memoryType,
      "allowed_tools": selectedConversation?.allowedTools.map((tool) => tool.name)
    })

    const response = await fetch(urlService, {
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
      )
      
      throw ({statusCode: response.status, statusText: errorText})
    }
  }

  const handleEmbed = async (files: File[]) => {
    // TODO: send the files to the server in multipart format one by one
    // call the endpint 'api/embed?serviceId=${selectedConversation.id}&clientId=${clientId}'
    // and send the files in the body
    try {
      homeDispatch({ field: 'loading', value: true })
      homeDispatch({ field: 'messageIsStreaming', value: true })
      const serviceId = selectedConversation?.id;
      const clientId = getClientId()
      if (isEditableConversation()) {
        await updateService(serviceId!, clientId)
      }

      const url = `api/embed?serviceId=${serviceId}&clientId=${clientId}`
      let newEmbeddedFiles: string[] = []
      for (const filePath of files) {
        
        const formData = new FormData();
        formData.append('file', filePath);
        
        let headers = {}
        const selectedEmbeddingModelName = selectedConversation?.embeddingModel.id
        console.log('selectedEmbeddingModel:', selectedEmbeddingModelName)
        if (selectedEmbeddingModelName?.startsWith('azure-')) {
          headers = {
            'Authorization': `Bearer ${azureApiKey}`,
          }
        } else if (selectedEmbeddingModelName?.startsWith('text-embedding-ada')) {
          headers = {
            'Authorization': `Bearer ${apiKey}`,
          }
        }

        // Send the file to the server
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: formData as any,
        });

        // Check if the request was successful
        if (response.ok) {
          console.log(`Successfully uploaded ${filePath.name}`);
          newEmbeddedFiles.push(filePath.name)
        } else {
          console.error(`Failed to upload ${filePath}. Status: ${response.status}`);
        }

      }

      if (selectedConversation && newEmbeddedFiles.length > 0) {
        let updatedConversation: Conversation = {
          ...selectedConversation,
          files: [...selectedConversation.files, ...newEmbeddedFiles]
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        })
        saveConversation(updatedConversation)
      }
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
    } catch (error) {
      console.error('An error occurred:', error);
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
    }
  }

  const handleSend = useCallback(
    async (message: MultimodalMessage, deleteCount = 0, plugin: Plugin | null = null) => {
      if (selectedConversation) {
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        console.log('modelname ', updatedConversation.model.name)
        console.log('apikey', apiKey)
        console.log('azureapikey', azureApiKey)
        const key = updatedConversation.model.name.includes('AZURE') ? azureApiKey : apiKey;
        console.log('key', key)

        if (isEditableConversation()) {
          await updateService(selectedConversation.id, getClientId())
        }
      
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          embeddingModel: updatedConversation.embeddingModel,
          messages: updatedConversation.messages,
          key: key,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
          topP: updatedConversation.topP,
          memoryType: updatedConversation.memoryType,
          allowedTools: updatedConversation.allowedTools,
        };
        const endpoint = getEndpoint(plugin);
        let body;
        console.log('pluginKeys', pluginKeys)
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }
        const controller = new AbortController();
        let clientId = getClientId()
        
        const url = `${endpoint}?serviceId=${selectedConversation.id}&clientId=${clientId}&shared=${selectedConversation.shared}`

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        })
        if (!response.ok) {
          const message = await response.json()
          console.log('!response.ok', message)
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          const updatedMessages: MultimodalMessage[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: message.statusText },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          });
          return;
        }
        const data = response.body;
        if (!data) {
          console.log('!data')
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
        //if (!plugin) {
        if (true) {
          if (updatedConversation.messages.length === 1) {
            const text = getText(message) || ''
            const customName = 
              text?.length > 30 ? text.substring(0, 30) + '...' : text;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = true;
          let text = '';
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort();
              done = true;
              break;
            }
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            text += chunkValue;
            if (isFirst) {
              isFirst = false;
              const updatedMessages: MultimodalMessage[] = [
                ...updatedConversation.messages,
                { role: 'assistant', content: [{type: 'text', text: chunkValue}] },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            } else {
              const updatedMessages: MultimodalMessage[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: [{type: 'text', text}] ,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            }
          }
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      // send request to server to clear messages
      try {
        const clientId = localStorage.getItem('clientId');
        const url = `api/clients?serviceId=${selectedConversation.id}&clientId=${clientId}`
        fetch(url, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error clearing chat history on server:', error);
        throw error;
      }
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      })
    }
  }


  const onClearEmbeddings = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all embeddings?')) &&
      selectedConversation
    ) {
      // send request to server to clear messages
      try {
        
        const url = `api/clearEmbeddings?serviceId=${selectedConversation.id}`
        fetch(url, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error clearing embeddings on server:', error);
        throw error;
      }
      handleUpdateConversation(selectedConversation, {
        key: 'files',
        value: [],
      })
    }
  }



  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  function validateApiKey() {
    const name = selectedModel?.name
    console.log('selectedModel', selectedModel)
    if (name?.startsWith('AZURE')) {
      return !!azureApiKey ? '' : 'Azure OpenAI API Key is not found!'
    } else if (name?.startsWith('GPT')) {
      return !!apiKey ? '' : 'OpenAI API Key is not found!'
    }
    return ''
  }

  function isEditableConversation() {
    return selectedConversation && selectedConversation.messages?.length === 0 && selectedConversation.files?.length === 0 && !selectedConversation.shared
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages?.length === 0 && selectedConversation?.files?.length === 0 ? (
              <>
                <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-2 md:pt-6 sm:max-w-[600px]">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                  </div>
                  {models.length >= 0 && (
                    <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600 z-10" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <ModelSelect type='chat' title='Chat Model' setSelectedModel={setSelectedModel}/>
                      {validateApiKey() && <div className="flex">
                        <IconExclamationCircle className="mr-4"/>
                        <span>{validateApiKey()}</span>
                      </div>}
                      <ModelSelect type='text-embedding' title='Embedding Model' setSelectedModel={setSelectedEmbeddingModel}/>
                      <SystemPrompt
                        conversation={selectedConversation}
                        prompts={prompts}
                        onChangePrompt={(prompt) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'prompt',
                            value: prompt,
                          })
                        }
                      />
                      <Slider
                        label={t('Temperature')}
                        onChange={(value: number) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'temperature',
                            value: value,
                          })
                        }
                        value={selectedConversation?.temperature || 1}
                      />

                      <Slider
                        label={t('Top P')}
                        onChange={(value: number) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'topP',
                            value: value,
                          })
                        }
                        value={selectedConversation?.topP || 1}
                      />

                      {selectedConversation?.files?.length > 0 && (
                          <EmbeddedFiles
                          files={selectedConversation?.files}
                          onClear={onClearEmbeddings}
                          />
                      )}
                      <MemoryTypeSelect/>
                      <AllowedToolSelector tools={tools} />

                    </div>
                  )}
                </div>
              </>
            ) : ((selectedConversation && selectedConversation.model) && (
              <>
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {t('Model')}: {selectedConversation?.model.name} | {t('Temp')}
                  : {selectedConversation?.temperature} | {t('Top P')}: {selectedConversation?.topP}|
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={handleSettings}
                  >
                    <IconSettings size={18} />
                  </button>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                    >
                    <IconClearAll size={18} />
                  </button>
                </div>
                {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                      <ModelSelect type='chat' title='Chat Model' disabled={true}/>
                      <ModelSelect type='text-embedding' title='Embedding Model' disabled={true}/>
                      <SystemPrompt
                        conversation={selectedConversation!}
                        prompts={prompts}
                        onChangePrompt={(prompt) =>
                          handleUpdateConversation(selectedConversation!, {
                            key: 'prompt',
                            value: prompt,
                          })
                        }
                        disabled={true}
                      />

                      <Slider
                        label={t('Temperature')}
                        disabled={true}
                        value={selectedConversation?.temperature || 1}
                      />
                      <Slider
                        label={t('Top P')}
                        disabled={true}
                        value={selectedConversation?.topP || 1}
                      />
                      <EmbeddedFiles
                        files={selectedConversation?.files!}
                        onClear={onClearEmbeddings}
                      />
                      <MemoryTypeSelect disabled={true}/>
                      <AllowedToolSelector tools={tools} disabled={true}/>
                    </div>
                  </div>
                )}

                {selectedConversation?.messages?.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index,
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}

                <div
                  className="h-[162px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            ))}
          </div>

          {!validateApiKey() &&
            <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
            }}
            onEmbed={(files) => {
              handleEmbed(files)
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2, null);
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
          }
        </>
    </div>
  );
})
Chat.displayName = 'Chat';
