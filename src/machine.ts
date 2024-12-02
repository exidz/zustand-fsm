import { create } from "zustand";

type EventConfig<T> = {
  target: string;
  guard?: (ctx: T) => boolean;
  reducer?: (ctx: T, payload?: Partial<T>) => T;
};

type StateConfig<T> = {
  entry?: (ctx: T) => T;
  exit?: (ctx: T) => T;
  on?: Record<string, EventConfig<T>>;
  parent?: string;
};

type Config<T> = {
  context: T;
  states: Record<string, StateConfig<T>>;
};

type Store<T> = {
  current: string;
  context: T;
  previous: string | null;
  send: (evt: string, payload?: Partial<T>) => void;
  getSnapshot: () => { state: string; context: T };
  matches: (state: string) => boolean;
  reset: () => void;
};

export class Machine<T extends object> {
  private cfg: Config<T>;
  private init: string;
  private hist: Array<{ state: string; ctx: T }> = [];
  private initCtx: T;
  private mw: Array<(evt: string, ctx: T, payload?: Partial<T>) => void> = [];

  constructor(config: Config<T>) {
    this.init = Object.keys(config.states)[0];
    this.cfg = config;
    this.initCtx = { ...config.context };
  }

  use(fn: (evt: string, ctx: T, payload?: Partial<T>) => void) {
    this.mw.push(fn);
    return this;
  }

  store() {
    return create<Store<T>>((set, get: () => Store<T>) => ({
      current: this.init,
      context: { ...this.initCtx },
      previous: null,

      send: (evt: string, payload?: Partial<T>) => {
        const { current, context } = get();
        const state = this.cfg.states[current];
        const event = state.on?.[evt];

        if (!event || (event.guard && !event.guard(context))) return;

        this.mw.forEach((m) => m(evt, context, payload));

        let ctx = state.exit ? state.exit({ ...context }) : { ...context };

        if (event.reducer) ctx = event.reducer(ctx, payload);

        if (event.target) {
          const target = this.cfg.states[event.target];
          if (target.entry) ctx = target.entry(ctx);

          this.hist.push({ state: current, ctx: context });
          set({
            previous: current,
            current: event.target,
            context: ctx,
          });
        }
      },

      getSnapshot: () => ({
        state: get().current,
        context: get().context,
      }),

      matches: (state: string) => {
        let current = get().current;
        let currentState = this.cfg.states[current];

        if (current === state) return true;

        while (currentState?.parent) {
          if (currentState.parent === state) return true;
          currentState = this.cfg.states[currentState.parent];
        }

        return false;
      },

      reset: () => {
        set({
          current: this.init,
          context: { ...this.initCtx },
          previous: null,
        });
        this.hist = [];
      },
    }));
  }

  getHistory() {
    return [...this.hist];
  }
}
