import HomeContext from '@/pages/api/home/home.context';
import { Tool } from '@/types/tool';
import React, { FC, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';

interface AllowedToolSelectorProps {
  tools: Tool[];
  disabled?: boolean;
}

export const AllowedToolSelector: FC<AllowedToolSelectorProps> = ({
  tools,
  disabled = false,
}) => {
  console.log('AllowedToolSelector')
  console.log('disabled', disabled)
  const {
    state: { selectedConversation},
    handleUpdateConversationMultiple,
    dispatch: homeDispatch,
  } = useContext(HomeContext);


  const title = 'Allowed Tools';
  const { t } = useTranslation('common'); // Adjust the namespace if needed
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);

  const handleCheckboxChange = (tool: Tool) => {
    console.log('0000000')
    if (!selectedConversation) return;
    console.log('1111111')
    const updatedSelectedTools = selectedTools.includes(tool)
      ? selectedTools.filter((selectedOption) => selectedOption !== tool)
      : [...selectedTools, tool];

    setSelectedTools(updatedSelectedTools);
    handleUpdateConversationMultiple(selectedConversation,
      [{
        key: 'allowedTools',
        value: updatedSelectedTools
      }]
    )
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {title}
      </label>
      <div className="flex flex-col w-full rounded-lg border border-neutral-200 bg-transparent p-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        {tools.map((tool, index) => (
          <label key={index} className="flex items-center mb-2">
            <input
              type="checkbox"
              className="mr-2"
              value={tool.name}
              checked={selectedTools.includes(tool)}
              onChange={() => handleCheckboxChange(tool)}
              disabled={disabled}
            />
            {`${tool.name} - ${tool.description}`}
          </label>
        ))}
      </div>
    </div>
  );
};