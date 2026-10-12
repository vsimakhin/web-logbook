import { queryOptions, useQuery } from '@tanstack/react-query';
import { fetchAircraftModelsCategories } from '../../util/http';

export const modelsCategoriesQueryOptions = queryOptions({
    queryKey: ['models-categories'],
    queryFn: ({ signal }) => fetchAircraftModelsCategories({ signal }),
    staleTime: 3600000,
    gcTime: 3600000,
    refetchOnWindowFocus: false,
    select: (data) => data || [],
});

export const useModelsCategoriesQuery = (options = {}) => {
    return useQuery({
        ...modelsCategoriesQueryOptions,
        ...options,
    });
};
