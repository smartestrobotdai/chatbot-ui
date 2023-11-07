import { Conversation } from "@/types/chat";
import { MemoryType } from "@/types/memoryType";

function stringToMemoryType(input: string): MemoryType | undefined {
  if (Object.values(MemoryType).includes(input as MemoryType)) {
      return input as MemoryType;
  }
  return undefined; // or throw an error, or return a default value
}


export {stringToMemoryType}