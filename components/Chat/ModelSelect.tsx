import { IconExternalLink } from '@tabler/icons-react';
import { FC, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { OpenAIModel } from '@/types/openai';

import HomeContext from '@/pages/api/home/home.context';
import { Conversation } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_SYSTEM_PROMPT_IMAGE } from '@/utils/app/const';
import { KeyValuePair } from '@/types/data';

interface ModelSelectProps {
  setSelectedModel?: (model: OpenAIModel) => void; // This indicates setSelectedModel is an optional function prop.
  disabled?: boolean;
  type?: 'chat' | 'text-embedding'; // Replace 'anotherType' with other possible types.
  title?: string;
}


export const ModelSelect:FC<ModelSelectProps>  = ({ setSelectedModel, disabled = false, 
  type = 'chat', title = 'Model' }) => {
  type SelectedConversationKey = keyof Conversation;
  let keyName:SelectedConversationKey = 'model'
  if (type === 'chat') {
    keyName = 'model'
  } else if (type === 'text-embedding') {
    keyName = 'embeddingModel'
  } else {
    throw new Error('Invalid type')
  }

  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, models, defaultModelId },
    handleUpdateConversationMultiple,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // to check if apikey is set or serverSideApiKeyisSet is true
    const model = models.find(
      (model) => model.id === e.target.value,
    ) as OpenAIModel

    let prompt = DEFAULT_SYSTEM_PROMPT
    if (model.imageSupport) {
      prompt = DEFAULT_SYSTEM_PROMPT_IMAGE
    }

    if (model !== selectedConversation?.[keyName]) {
      let keys_to_update: KeyValuePair[] = [{
        key: keyName,
        value: model
      }]

      if (keyName === 'model') {
        keys_to_update.push({
          key: 'prompt',
          value: prompt
        })
      }

      //setSelectedModel && setSelectedModel(model)
      if (selectedConversation) {
        handleUpdateConversationMultiple(selectedConversation, keys_to_update);
      }
    }

    setSelectedModel && setSelectedModel(model)
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {title}
      </label>
      <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          className="w-full bg-transparent p-2"
          placeholder={t('Select a model') || ''}
          value={type==='chat'?selectedConversation?.model?.id:selectedConversation?.embeddingModel?.id 
            || defaultModelId}
          onChange={handleChange}
          disabled={disabled}
        >
          {models.map((model) => (
            model.type === type && <option
              key={model.id}
              value={model.id}
              className="dark:bg-[#343541] dark:text-white"
            >
              {model.id === defaultModelId
                ? `Default (${model.name})`
                : model.name}
            </option>
          ))}
        </select>
      </div>
      {
       type==='chat' && selectedConversation?.model?.id.includes('gpt') &&
        <div className="w-full mt-3 text-left text-neutral-700 dark:text-neutral-400 flex items-center">
          <a
            href="https://platform.openai.com/account/usage"
            target="_blank"
            className="flex items-center"
          >
            <IconExternalLink size={18} className={'inline mr-1'} />
            {t('View Account Usage')}
          </a>
        </div>
      }

    </div>
  );
};
