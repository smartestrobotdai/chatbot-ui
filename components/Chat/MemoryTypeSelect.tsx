import { IconExternalLink } from '@tabler/icons-react';
import { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import { OpenAIModel } from '@/types/openai';

import HomeContext from '@/pages/api/home/home.context';
import { MemoryType, memoryTypeArray } from '@/types/memoryType';
import { stringToMemoryType } from './util';


export const MemoryTypeSelect = ({disabled = false}) => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, defaultModelId, defaultMemoryType},
    handleUpdateConversationMultiple,
    dispatch: homeDispatch,
  } = useContext(HomeContext);


  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // to check if apikey is set or serverSideApiKeyisSet is true
    if (!selectedConversation) return;
    
    if (selectedConversation && e.target.value !== selectedConversation.memoryType) {
      console.log('e.target.value', e.target.value)
      const newMemoryType = stringToMemoryType(e.target.value)
      const updated = {...selectedConversation, memoryType: newMemoryType!, id: selectedConversation.id || ''}
      console.log('updated', updated)
      handleUpdateConversationMultiple(selectedConversation,
        [{
          key: 'memoryType',
          value: newMemoryType
        }]
      )
    }
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        Memory Type
      </label>
      <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          className="w-full bg-transparent p-2"
          placeholder={t('Select memory type') || ''}
          value={selectedConversation?.memoryType || defaultMemoryType}
          onChange={handleChange}
          disabled={disabled}
        >
          {memoryTypeArray.map((type) => (
            <option
              key={type}
              value={type}
              className="dark:bg-[#343541] dark:text-white"
            >
              {type === defaultMemoryType
                ? `Default (${type})`
                : type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
