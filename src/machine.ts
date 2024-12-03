import { create } from "zustand";
import { combine } from "zustand/middleware";

type EventCfg<T> = {
  target?: string;
  guard?: (ctx: T) => boolean;
  reducer?: (ctx: T, p?: Partial<T>) => T;
};

type StateCfg<T> = {
  entry?: (ctx: T) => T;
  exit?: (ctx: T) => T;
  on?: Record<string, EventCfg<T>>;
  parent?: string;
};

type Cfg<T> = {
  context: T;
  states: Record<string, StateCfg<T>>;
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

export function createMachine<T extends object>(cfg: Cfg<T>) {
  const initState = Object.keys(cfg.states)[0];
  const initCtx = { ...cfg.context };
  let history: Array<{ state: string; ctx: T }> = [];
  const listeners: Array<(evt: string, ctx: T, p?: Partial<T>) => void> = [];

  const watch = (fn: (evt: string, ctx: T, p?: Partial<T>) => void) => {
    listeners.push(fn);
    return { watch };
  };

  const getHistory = () => [...history];

  const store = (
    mw: Array<(cfg: any) => (set: any, get: any, api: any) => any> = []
  ) => {
    const str = create(
      mw.reduce(
        (prev, curr) => curr(prev),
        combine(
          {
            current: initState,
            context: initCtx,
            previous: null,
            send: () => {},
            getSnapshot: () => ({ state: "", context: {} as T }),
            matches: () => false,
            reset: () => void 0,
          } as Store<T>,
          (set, get: () => Store<T>) => ({
            send: (evt: string, p?: Partial<T>) => {
              const { current, context } = get();
              const state = cfg.states[current];
              const event = state.on?.[evt];

              if (!event || (event.guard && !event.guard(context))) return;

              listeners.forEach((m) => m(evt, context, p));

              let ctx = state.exit
                ? state.exit({ ...context })
                : { ...context };
              if (event.reducer) ctx = event.reducer(ctx, p);

              if (event.target) {
                const target = cfg.states[event.target];
                if (target.entry) ctx = target.entry(ctx);

                history.push({ state: current, ctx: context });
                set({
                  previous: current,
                  current: event.target,
                  context: ctx,
                });
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
                context: { ...initCtx },
                previous: null,
              });
              history = [];
            },
          })
        )
      )
    );

    return str;
  };

  return { watch, store, getHistory };
}
