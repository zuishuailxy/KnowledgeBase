// hooks/useUserProfile.ts
import useUserStore from '../store/user';

export const useUserProfile = () => {
  const name = useUserStore(state => state.name);
  const rap = useUserStore(state => state.hobby.rap);
  // 如果还需要其他字段，继续加

  return { name, rap };
};