import { create, StateCreator } from "zustand";
import { combine } from "zustand/middleware";

type Event<T> = {
  target?: string;
  guard?: (x: T) => boolean;
  reducer?: (ctx: T, p?: Partial<T>) => T;
};

type State<T> = {
  entry?: (x: T) => T;
  exit?: (x: T) => T;
  on?: Record<string, Event<T>>;
  parent?: string;
};

type Store<T> = {
  current: string;
  context: T;
  previous: string | null;
  send: (evt: string, p?: Partial<T>) => void;
  getSnapshot: () => { state: string; context: T };
  matches: (state: string) => boolean;
  reset: () => void;
};

export const createMachine = <T extends object>(cfg: {
  context: T;
  states: Record<string, State<T>>;
}) => {
  const initState = Object.keys(cfg.states)[0];
  const initContext = { ...cfg.context };
  let history: Array<{ state: string; context: T }> = [];
  let watchFn:
    | ((p: {
        event: string;
        context: T;
        current: string;
        payload?: Partial<T>;
      }) => void)
    | null = null;

  return {
    watch: (fn: typeof watchFn) => {
      watchFn = fn;
      return () => {
        watchFn = null;
      };
    },
    getHistory: () => [...history],
    store: (middlewares: Array<(c: StateCreator<Store<T>>) => any> = []) => {
      const initialStore: Store<T> = {
        current: initState,
        context: initContext,
        previous: null,
        send: () => {},
        getSnapshot: () => ({ state: "", context: {} as T }),
        matches: () => false,
        reset: () => void 0,
      };

      const store = combine(initialStore, (set, get) => ({
        send: (evt: string, p?: Partial<T>) => {
          const { current, context } = get();
          const state = cfg.states[current];
          const event = state.on?.[evt];

          if (!event || (event.guard && !event.guard(context))) return;
          watchFn?.({ event: evt, context, current, payload: p });

          let ctx = state.exit ? state.exit({ ...context }) : { ...context };
          if (event.reducer) ctx = event.reducer(ctx, p);

          if (event.target) {
            const target = cfg.states[event.target];
            if (target.entry) ctx = target.entry(ctx);
            history.push({ state: current, context });
            set({ previous: current, current: event.target, context: ctx });
          } else {
            set({ context: ctx });
          }
        },
        getSnapshot: () => ({
          state: get().current,
          context: get().context,
        }),
        matches: (state: string) => {
          let curr = get().current;
          let currState = cfg.states[curr];
          if (curr === state) return true;
          while (currState?.parent) {
            if (currState.parent === state) return true;
            currState = cfg.states[currState.parent];
          }
          return false;
        },
        reset: () => {
          set({
            current: initState,
            context: { ...initContext },
            previous: null,
          });
          history = [];
        },
      }));

      return create(middlewares.reduce((p, c) => c(p), store));
    },
  };
};
