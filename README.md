

# zustand-fsm

A lightweight state machine implementation for Zustand state management. This library provides a simple yet powerful way to manage complex state transitions with features like guards, reducers, middleware, and hierarchical states.

## Installation

```bash
npm i zustand-fsm
```

## Basic Usage

```typescript
import { Machine } from "zustand-fsm";

export interface Counter {
  count: number;
}

const initialCtx = {
  count: 0,
};

const counterMachine = new Machine<Counter>({
  context: initialCtx,
  states: {
    idle: {
      on: {
        ADD: {
          target: "idle",
          reducer: (ctx) => ({
            count: ctx.count + 1,
          }),
        },
        SUB: {
          target: "idle",
          guard: (ctx) => ctx.count > 0,
          reducer: (ctx) => ({ count: ctx.count - 1 }),
        },
      },
    },
  },
});

const useCounterMachine = counterMachine.store();

export default useCounterMachine;
```

## Features

### Guards
Guards are conditions that must be met for a transition to occur:
```typescript
const machine = new Machine({
  context: { count: 0 },
  states: {
    idle: {
      on: {
        INCREMENT: {
          target: 'idle',
          guard: (ctx) => ctx.count < 10,
          reducer: (ctx) => ({ count: ctx.count + 1 })
        }
      }
    }
  }
});
```

### Entry and Exit Actions
Execute code when entering or leaving states:
```typescript
const machine = new Machine({
  context: { count: 0, lastUpdated: null },
  states: {
    idle: {
      entry: (ctx) => ({ ...ctx, lastUpdated: new Date() }),
      exit: (ctx) => ({ ...ctx, lastUpdated: new Date() }),
      on: {
        INCREMENT: { target: 'processing' }
      }
    },
    processing: {
      // ... other state configuration
    }
  }
});
```

### Middleware
Add middleware for logging, analytics, or side effects:

```typescript
const machine = new Machine(config)
  .use((event, context, payload) => {
    console.log('Event:', event);
    console.log('Context:', context);
    console.log('Payload:', payload);
  });
```

### History Tracking
Access state transition history:
```typescript
const history = machine.getHistory();
```

### Methods
- `use(middleware)`: Add middleware function
- `store()`: Create a Zustand store
- `getHistory()`: Get state transition history

### Store API
The created store provides the following methods:
- `send(event, payload?)`: Trigger a state transition
- `getSnapshot()`: Get current state and context
- `matches(state)`: Check if current state matches or inherits from given state
- `reset()`: Reset machine to initial state

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.