export enum MemoryType {
  NO_MEMORY = 'NO-MEMORY',
  BUFFER_WINDOW = 'BUFFER-WINDOW',
  MEMORY_SUMMARIZER = 'SUMMARIZER',
}

export const memoryTypeArray = Object.values(MemoryType).filter(
  (value) => typeof value === 'string'
) as string[];
