import { useCallback, useState } from 'react';
import { createReview, type CreateReviewPayload } from '../api';
import type { PublicReview, ReviewComponentConfig } from '../types';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; review: PublicReview }
  | { status: 'error'; message: string };

export function useSubmitReview(config: ReviewComponentConfig) {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  const submit = useCallback(
    async (payload: Omit<CreateReviewPayload, 'externalProductId'>) => {
      setState({ status: 'submitting' });
      try {
        const review = await createReview(config, {
          ...payload,
          externalProductId: config.externalProductId,
        });
        setState({ status: 'success', review });
      } catch (err) {
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Submission failed',
        });
      }
    },
    [config],
  );

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, submit, reset };
}
