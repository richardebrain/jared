import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get the school's custom reward currency name
 * Returns the custom name or defaults to "Bear Bucks"
 */
export const useRewardCurrency = () => {
  const { data: school } = useQuery({
    queryKey: ['/api/school/settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const currencyName = school?.customization?.rewardCurrency?.name || 'Bear Bucks';
  
  return {
    currencyName,
    isCustomized: !!school?.customization?.rewardCurrency?.name,
    school
  };
};