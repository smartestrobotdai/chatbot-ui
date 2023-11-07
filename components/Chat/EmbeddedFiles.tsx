import { IconClearAll } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  files: string[];
  onClear: () => void;
}


export const EmbeddedFiles: FC<Props> = ({
  files,
  onClear
}) => {
  return (
    <div> 
      <div className="flex justify-between items-center mb-2"> {/* Added flex container with justify-between */}
        <label className="text-neutral-700 dark:text-neutral-400">
          Embedded Files
        </label>
        <button
          title="Clear embedded files"
          className="cursor-pointer hover:opacity-50"
          aria-label="Clear embedded files" // Always include accessible labels
          onClick={onClear}
        >
          <IconClearAll size={18} />
        </button>
      </div>
      {files.map((file, index) => (
        <div key={index}>{file}</div> // Remember to provide a unique key for each child
      ))}
    </div>
  );
}

