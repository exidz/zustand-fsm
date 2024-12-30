# zustand-fsm

A lightweight, flexible, and powerful state machine implementation for Zustand state management. This library simplifies managing complex state transitions with features like guards, reducers, middleware, hierarchical states, and more.

## Installation

Install the library using npm:

```bash
npm i zustand-fsm
```

---

## Overview

`zustand-fsm` provides a state machine implementation that integrates seamlessly with Zustand. It allows you to define states, transitions, and context in a structured way, making it easier to manage complex state logic in your applications.

### Key Features:

- **Guards**: Conditional transitions based on the current context.
- **Middleware**: Support Zustand middlewares like `devtools` or `persist`.
- **Hierarchical States**: Support for parent-child state relationships.
- **Entry/Exit Actions**: Execute logic when entering or exiting states.
- **Event Watchers**: Observe state transitions for logging or side effects.
- **History Tracking**: Access the history of state transitions.

---

## Basic Usage

Here’s how to create and use a state machine with `zustand-fsm`:

### Example: Counter State Machine

```typescript
import { createMachine } from "zustand-fsm";

type CounterContext = {
  count: number;
};

const counterMachine = createMachine<CounterContext>({
  context: { count: 0 },
  states: {
    idle: {
      on: {
        INCREMENT: {
          reducer: (ctx) => ({ count: ctx.count + 1 }),
        },
        DECREMENT: {
          guard: (ctx) => ctx.count > 0,
          reducer: (ctx) => ({ count: ctx.count - 1 }),
        },
      },
    },
  },
});

const useCounterStore = counterMachine.store();

export default useCounterStore;
```

---

## API Documentation

### Machine Configuration

The state machine is configured using a `Config` object, which includes the initial context, states, and transitions.

#### Config Object

```typescript
type Config<T> = {
  context: T; // Initial context
  states: Record<string, StateConfig<T>>; // State definitions
};
```

#### State Configuration

Each state can define:

- **Entry/Exit Actions**: Functions executed when entering or exiting the state.
- **Transitions**: Events that trigger state changes.
- **Parent**: Optional parent state for hierarchical state machines.

```typescript
type StateConfig<T> = {
  entry?: (ctx: T) => T; // Action on entering the state
  exit?: (ctx: T) => T; // Action on exiting the state
  on?: Record<string, EventConfig<T>>; // Event transitions
  parent?: string; // Parent state (for hierarchical states)
};
```

#### Event Configuration

Each event can define:

- **Target**: The state to transition to.
- **Guard**: A condition that must be met for the transition to occur.
- **Reducer**: A function to update the context during the transition.

```typescript
type EventConfig<T> = {
  target?: string; // Target state
  guard?: (ctx: T) => boolean; // Condition for the transition
  reducer?: (ctx: T, payload?: Partial<T>) => T; // Context update logic
};
```

---

### Machine Methods

The machine provides the following methods:

#### `store(middleware?)`

Creates a Zustand store for the state machine. You can optionally pass Zustand middleware (e.g., `devtools`, `persist`).

```typescript
const useStore = machine.store([devtools, persist]);
```

#### `watch(fn)`

Adds a watcher function to observe state transitions. Useful for logging, analytics, or side effects.

```typescript
machine.watch(({event, context, payload}) => {
  console.log("Event:", event);
  console.log("Context:", context);
  console.log("Payload:", payload);
});
```

#### `getHistory()`

Returns the history of state transitions.

```typescript
const history = machine.getHistory();
console.log(history);
```

---

### Store API

The Zustand store created by the machine provides the following methods:

#### `send(event, payload?)`

Triggers a state transition by sending an event. Optionally, you can pass a payload to update the context.

```typescript
useStore.getState().send("INCREMENT");
useStore.getState().send("DECREMENT", { count: 5 });
```

#### `getSnapshot()`

Returns the current state and context.

```typescript
const snapshot = useStore.getState().getSnapshot();
console.log(snapshot.current); // Current state
console.log(snapshot.context); // Current context
```

#### `matches(state)`

Checks if the current state matches or inherits from the given state.

```typescript
if (useStore.getState().matches("idle")) {
  console.log("The machine is in the idle state.");
}
```

#### `reset()`

Resets the machine to its initial state and context.

```typescript
useStore.getState().reset();
```

---

## Features

### Guards

Guards are conditions that must be met for a transition to occur.

```typescript
const machine = createMachine<Context>({
  context: { count: 0 },
  states: {
    idle: {
      on: {
        INCREMENT: {
          guard: (ctx) => ctx.count < 10,
          reducer: (ctx) => ({ count: ctx.count + 1 }),
        },
      },
    },
  },
});
```

### Entry and Exit Actions

Execute logic when entering or exiting states.

```typescript
const machine = createMachine<Context>({
  context: { count: 0 },
  states: {
    idle: {
      entry: (ctx) => ({ ...ctx, lastUpdated: new Date() }),
      exit: (ctx) => ({ ...ctx, lastUpdated: new Date() }),
      on: {
        NEXT: { target: "processing" },
      },
    },
    processing: {
      // Other state configuration
    },
  },
});
```

### Hierarchical States

Support for parent-child state relationships.

```typescript
const machine = createMachine<Context>({
  context: {
    /* ... */
  },
  states: {
    parent: {
      on: {
        SHARED_EVENT: {
          /* ... */
        },
      },
    },
    child: {
      parent: "parent",
      on: {
        CHILD_EVENT: {
          /* ... */
        },
      },
    },
  },
});
```

### Middleware

Enhance the store with Zustand middleware like `devtools` or `persist`.

```typescript
import { devtools, persist } from "zustand/middleware";

const machine = createMachine<Context>({
  context: { count: 0 },
  states: {
    idle: {
      on: {
        INCREMENT: {
          guard: (ctx) => ctx.count < 10,
          reducer: (ctx) => ({ count: ctx.count + 1 }),
        },
      },
    },
  },
});

const useCounterMachine = machine.store([
  devtools,
  (config) => persist(config, { name: "counter" }),
]);
```

---

## Contributing

Contributions are welcome! If you’d like to improve this library, feel free to submit a pull request or open an issue.
