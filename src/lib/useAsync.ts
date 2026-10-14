import { useEffect, useState } from 'react';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): { data?: T; error?: Error } {
  const [state, setState] = useState<{ data?: T; error?: Error }>({});
  useEffect(() => {
    let alive = true;
    setState({});
    fn().then(
      (data) => alive && setState({ data }),
      (error: Error) => alive && setState({ error }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
