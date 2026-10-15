import { useMutation } from '@tanstack/react-query';

import { signUp } from '@/lib/api';

export function useSignUp() {
  return useMutation({ mutationFn: signUp });
}
