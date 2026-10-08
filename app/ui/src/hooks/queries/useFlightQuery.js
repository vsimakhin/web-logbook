import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchFlightData } from '../../util/http';

export const flightQueryOptions = (id) =>
  queryOptions({
    queryKey: ['flight', id],
    queryFn: ({ signal }) => fetchFlightData({ signal, id }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
  });

export const useFlightQuery = (id, options = {}) => {
  return useQuery({
    ...flightQueryOptions(id),
    ...options,
  });
};