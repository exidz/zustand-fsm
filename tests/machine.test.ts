
import { createMachine } from '../src/machine';

// Test Types
type LightContext = {
  duration: number;
  color: string;
};

type LightEvents = 
  | 'TIMER'
  | 'NEXT'
  | 'EMERGENCY'
  | 'RESET'
  | 'UPDATE_DURATION';

describe('State Machine', () => {
  // Basic Traffic Light Machine Setup
  const createTrafficLight = () => createMachine<LightContext>({
    context: {
      duration: 1000,
      color: 'red'
    },
    states: {
      red: {
        entry: (ctx) => ({ ...ctx, color: 'red' }),
        on: {
          NEXT: { target: 'green' },
          EMERGENCY: { target: 'flashing' }
        }
      },
      green: {
        entry: (ctx) => ({ ...ctx, color: 'green' }),
        on: {
          NEXT: { target: 'yellow' },
          EMERGENCY: { target: 'flashing' }
        }
      },
      yellow: {
        entry: (ctx) => ({ ...ctx, color: 'yellow' }),
        on: {
          NEXT: { target: 'red' },
          EMERGENCY: { target: 'flashing' }
        }
      },
      flashing: {
        parent: 'red',
        on: {
          RESET: { target: 'red' }
        }
      }
    }
  });

  test('initial state setup', () => {
    const machine = createTrafficLight();
    const store = machine.store();

    expect(store.getState().current).toBe('red');
    expect(store.getState().context).toEqual({
      duration: 1000,
      color: 'red'
    });
  });

  test('basic state transition', () => {
    const machine = createTrafficLight();
    const store = machine.store();

    store.getState().send('NEXT');
    expect(store.getState().current).toBe('green');
    expect(store.getState().context.color).toBe('green');
  });

  test('multiple transitions', () => {
    const machine = createTrafficLight();
    const store = machine.store();

    store.getState().send('NEXT'); // red -> green
    store.getState().send('NEXT'); // green -> yellow
    store.getState().send('NEXT'); // yellow -> red

    expect(store.getState().current).toBe('red');
    expect(store.getState().context.color).toBe('red');
  });

  test('history tracking', () => {
    const machine = createTrafficLight();
    const store = machine.store();

    store.getState().send('NEXT');
    store.getState().send('NEXT');

    const history = machine.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].state).toBe('red');
    expect(history[1].state).toBe('green');
  });

  test('state matching with parent states', () => {
    const machine = createTrafficLight();
    const store = machine.store();

    store.getState().send('EMERGENCY');
    expect(store.getState().current).toBe('flashing');
    expect(store.getState().matches('red')).toBe(true);
  });

  test('watch functionality', () => {
    const machine = createTrafficLight();
    const store = machine.store();
    const mockFn = jest.fn();

    machine.watch(({event, context}) => mockFn(event, context));
    store.getState().send('NEXT');

    expect(mockFn).toHaveBeenCalledWith('NEXT', expect.any(Object));
  });

  test('reset functionality', () => {
    const machine = createTrafficLight();
    const store = machine.store();

    store.getState().send('NEXT');
    store.getState().send('NEXT');
    store.getState().reset();

    expect(store.getState().current).toBe('red');
    expect(store.getState().context).toEqual({
      duration: 1000,
      color: 'red'
    });
    expect(machine.getHistory()).toHaveLength(0);
  });

  test('guard conditions', () => {
    const machine = createMachine<{ count: number }>({
      context: { count: 0 },
      states: {
        idle: {
          on: {
            INCREMENT: {
              guard: (ctx) => ctx.count < 5,
              reducer: (ctx) => ({ count: ctx.count + 1 })
            },
            DECREMENT: {
              guard: (ctx) => ctx.count > 0,
              reducer: (ctx) => ({ count: ctx.count - 1 })
            }
          }
        }
      }
    });

    const store = machine.store();

    // Test increment guard
    for (let i = 0; i < 6; i++) {
      store.getState().send('INCREMENT');
    }
    expect(store.getState().context.count).toBe(5);

    // Test decrement guard
    for (let i = 0; i < 6; i++) {
      store.getState().send('DECREMENT');
    }
    expect(store.getState().context.count).toBe(0);
  });

  test('middleware support', () => {
    const logger = (config: any) => (set: any, get: any, api: any) => {
      const wrapped = config(
        (...args: any[]) => {
          console.log('State changing:', ...args);
          return set(...args);
        },
        get,
        api
      );
      return wrapped;
    };

    const consoleSpy = jest.spyOn(console, 'log');
    const machine = createTrafficLight();
    const store = machine.store([logger]);

    store.getState().send('NEXT');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});