import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchLicenses } from '../../util/http';

export const licensingQueryOptions = queryOptions({
  queryKey: ['licensing'],
  queryFn: ({ signal }) => fetchLicenses({ signal }),
  staleTime: 3600000,
  gcTime: 3600000,
  refetchOnWindowFocus: false,
  select: (data) => data || [],
});

export const useLicensingQuery = (options = {}) => {
  return useQuery({
    ...licensingQueryOptions,
    ...options,
  });
};