import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchLogbookData } from '../../util/http';

export const logbookQueryOptions = queryOptions({
  queryKey: ['logbook'],
  queryFn: ({ signal }) => fetchLogbookData({ signal }),
  staleTime: 3600000,
  gcTime: 3600000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

export const useLogbookQuery = (options = {}) => {
  return useQuery({
    ...logbookQueryOptions,
    ...options,
  });
};