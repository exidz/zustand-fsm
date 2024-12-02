import { Machine } from "../src/machine";

describe("Zustand State Machine", () => {
  // Basic Counter Machine Setup
  interface Counter {
    count: number;
    lastUpdated?: Date;
  }

  const createCounterMachine = () => {
    return new Machine<Counter>({
      context: { count: 0 },
      states: {
        idle: {
          on: {
            INCREMENT: {
              target: "idle",
              reducer: (ctx) => ({ ...ctx, count: ctx.count + 1 }),
            },
            DECREMENT: {
              target: "idle",
              guard: (ctx) => ctx.count > 0,
              reducer: (ctx) => ({ ...ctx, count: ctx.count - 1 }),
            },
          },
        },
      },
    });
  };

  // Test Basic State Transitions
  describe("Basic State Transitions", () => {
    it("should initialize with correct initial state", () => {
      const machine = createCounterMachine();
      const store = machine.store();
      const { current, context } = store.getState();

      expect(current).toBe("idle");
      expect(context.count).toBe(0);
    });

    it("should increment counter", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      store.getState().send("INCREMENT");
      expect(store.getState().context.count).toBe(1);
    });

    it("should not decrement below zero", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      store.getState().send("DECREMENT");
      expect(store.getState().context.count).toBe(0);
    });
  });

  // Test Guards
  describe("Guards", () => {
    it("should respect guard conditions", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      // Try to decrement at 0
      store.getState().send("DECREMENT");
      expect(store.getState().context.count).toBe(0);

      // Increment and then decrement
      store.getState().send("INCREMENT");
      store.getState().send("DECREMENT");
      expect(store.getState().context.count).toBe(0);
    });
  });

  // Test Entry/Exit Actions
  describe("Entry/Exit Actions", () => {
    const machineWithActions = new Machine<Counter>({
      context: { count: 0 },
      states: {
        idle: {
          entry: (ctx) => ({ ...ctx, lastUpdated: new Date() }),
          exit: (ctx) => ({ ...ctx, lastUpdated: new Date() }),
          on: {
            NEXT: { target: "active" },
          },
        },
        active: {
          entry: (ctx) => ({ ...ctx, count: ctx.count + 1 }),
        },
      },
    });

    it("should execute entry and exit actions", () => {
      const store = machineWithActions.store();
      store.getState().send("NEXT");

      expect(store.getState().context.count).toBe(1);
      expect(store.getState().context.lastUpdated).toBeDefined();
    });
  });

  // Test Middleware
  describe("Middleware", () => {
    it("should execute middleware", () => {
      const middleware = jest.fn();
      const machine = createCounterMachine().use(middleware);
      const store = machine.store();

      store.getState().send("INCREMENT");
      expect(middleware).toHaveBeenCalled();
    });
  });

  // Test History
  describe("History", () => {
    it("should track state history", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      store.getState().send("INCREMENT");
      store.getState().send("INCREMENT");

      const history = machine.getHistory();
      expect(history.length).toBe(2);
    });
  });

  // Test Reset
  describe("Reset", () => {
    it("should reset to initial state", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      store.getState().send("INCREMENT");
      store.getState().send("INCREMENT");
      store.getState().reset();

      expect(store.getState().context.count).toBe(0);
      expect(store.getState().current).toBe("idle");
      expect(machine.getHistory().length).toBe(0);
    });
  });

  // Test Hierarchical States
  describe("Hierarchical States", () => {
    const hierarchicalMachine = new Machine<Counter>({
      context: { count: 0 },
      states: {
        parent: {
          on: {
            INCREMENT: {
              target: "parent",
              reducer: (ctx) => ({ ...ctx, count: ctx.count + 1 }),
            },
          },
        },
        child: {
          parent: "parent",
          on: {
            DOUBLE: {
              target: "child",
              reducer: (ctx) => ({ ...ctx, count: ctx.count * 2 }),
            },
          },
        },
      },
    });

    it("should handle hierarchical state matching", () => {
      const store = hierarchicalMachine.store();
      expect(store.getState().matches("parent")).toBe(true);
    });
  });

  // Test State Matching
  describe("State Matching", () => {
    it("should correctly match current and parent states", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      expect(store.getState().matches("idle")).toBe(true);
      expect(store.getState().matches("nonexistent")).toBe(false);
    });
  });

  // Test Snapshot
  describe("Snapshot", () => {
    it("should return correct snapshot", () => {
      const machine = createCounterMachine();
      const store = machine.store();

      store.getState().send("INCREMENT");
      const snapshot = store.getState().getSnapshot();

      expect(snapshot.state).toBe("idle");
      expect(snapshot.context.count).toBe(1);
    });
  });
});
