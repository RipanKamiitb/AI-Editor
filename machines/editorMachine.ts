import { setup, fromPromise, assign } from 'xstate';
import { generateContinuation } from '../services/geminiService';
import { EditorContext, EditorEvent } from '../types';

export const editorMachine = setup({
  types: {
    context: {} as EditorContext,
    events: {} as EditorEvent,
  },
  actors: {
    generateText: fromPromise(async ({ input }: { input: { currentText: string } }) => {
      const result = await generateContinuation(input.currentText);
      return result;
    }),
  },
  actions: {
    setError: assign({
      error: ({ event }: any) => {
        // Simple error extraction
        return event.error instanceof Error ? event.error.message : 'An unknown error occurred';
      }
    }),
    clearError: assign({
      error: () => null,
    }),
    setLastGenerated: assign({
      lastGeneratedText: ({ event }: any) => event.output,
      error: () => null
    }),
  },
}).createMachine({
  id: 'editor',
  initial: 'idle',
  context: {
    error: null,
    lastGeneratedText: null,
  },
  states: {
    idle: {
      on: {
        GENERATE: {
          target: 'generating',
          actions: 'clearError'
        },
      },
    },
    generating: {
      invoke: {
        id: 'generateTextService',
        src: 'generateText',
        input: ({ event }) => ({
          currentText: (event as any).currentText || '',
        }),
        onDone: {
          target: 'idle',
          actions: 'setLastGenerated',
        },
        onError: {
          target: 'failure',
          actions: 'setError',
        },
      },
    },
    failure: {
      on: {
        RETRY: {
          target: 'idle', // User acknowledges error, goes back to idle to try again or edit manually
          actions: 'clearError'
        },
        GENERATE: {
            target: 'generating',
            actions: 'clearError'
        }
      },
    },
  },
});
