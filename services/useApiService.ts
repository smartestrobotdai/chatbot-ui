import { useCallback } from 'react';

import { useFetch } from '@/hooks/useFetch';
import { getClientId } from '@/utils/app/settings';

export interface GetModelsRequestProps {
  key: string;
}

export interface GetConversationsRequestProps {
  key: string;
}

export interface ClearConversationsRequestProps {
  key: string;
}

const useApiService = () => {
  const fetchService = useFetch();

  // const getModels = useCallback(
  // 	(
  // 		params: GetManagementRoutineInstanceDetailedParams,
  // 		signal?: AbortSignal
  // 	) => {
  // 		return fetchService.get<GetManagementRoutineInstanceDetailed>(
  // 			`/v1/ManagementRoutines/${params.managementRoutineId}/instances/${params.instanceId
  // 			}?sensorGroupIds=${params.sensorGroupId ?? ''}`,
  // 			{
  // 				signal,
  // 			}
  // 		);
  // 	},
  // 	[fetchService]
  // );

  const getModels = useCallback(
    (params: GetModelsRequestProps, signal?: AbortSignal) => {
      return fetchService.post<GetModelsRequestProps>(`/api/models`, {
        body: { key: params.key },
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  const getConversations = useCallback(
    
    (params: GetConversationsRequestProps, signal?: AbortSignal) => {
      let clientId = getClientId()
      return fetchService.get<GetConversationsRequestProps>(`/api/services?clientId=${clientId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });
    },
    [fetchService],
  );

  return {
    getModels,
    getConversations,
  };
};

export default useApiService;
