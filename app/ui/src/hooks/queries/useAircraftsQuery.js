import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchAircrafts } from '../../util/http';

export const aircraftsQueryOptions = queryOptions({
    queryKey: ['aircrafts'],
    queryFn: ({ signal }) => fetchAircrafts({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
    select: (data) => data || [],
});

export const useAircraftsQuery = (options = {}) => {
    return useQuery({
        ...aircraftsQueryOptions,
        ...options,
    });
};