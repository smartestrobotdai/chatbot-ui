import { FC } from 'react';

interface Props {
  files: string[];

}

export const EmbeddedFiles: FC<Props> = ({
  files,
}) => {
  return (
  <div> 
    <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
      Embedded Files
    </label>
      {files.map((file) => (
        <div>{file}</div>
      ))}
  </div>
  )
}
