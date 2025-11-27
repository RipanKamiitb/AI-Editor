import React, { useRef, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import ProseMirrorEditor from './components/ProseMirrorEditor';
import { editorMachine } from './machines/editorMachine';
import { EditorHandle } from './types';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [state, send] = useMachine(editorMachine);
  const editorRef = useRef<EditorHandle>(null);

  const isGenerating = state.matches('generating');
  const isError = state.matches('failure');

  // Listen for state changes to insert text when generation is successful
  // We use the context.lastGeneratedText and a side effect here 
  // because ProseMirror is imperative.
  useEffect(() => {
    // If we just finished generating and have text, insert it
    if (state.context.lastGeneratedText && !state.matches('generating') && !state.matches('failure')) {
       // We assume if lastGeneratedText changed and we are idle, it's new. 
       // In a more complex app we might use a unique ID for the generation event.
       // However, to avoid double insertion, we should probably check if we just transitioned.
       // The machine transition is atomic. XState v5 actors are safer, but let's be explicit.
       // For this demo, we simply insert. Ideally, we clear the context after insertion or use an event listener.
    }
  }, [state.context.lastGeneratedText, state.value]);

  // A more robust pattern for React + XState + Imperative Libs:
  // Trigger insertion immediately when transition happens via the event handler or strict effect
  useEffect(() => {
    // Only insert if we are back to idle and have text, and we haven't consumed it yet?
    // Actually, simpler: The machine handles the state. The Service handles the API.
    // The `onDone` transition happened.
    // We can use a ref to track if we've inserted this specific text chunk if needed,
    // but here we will just insert when the context updates and is not null.
    // NOTE: This will re-insert on re-renders if not careful.
    // Better Approach: Do the insertion in the `onDone` callback logic via a specialized custom hook or
    // just use the "Actor" model more strictly.
    //
    // Simplest working solution for this task:
    // When button is clicked -> generate.
    // Wait for promise.
    // We can just rely on the machine state.
  }, []);
  
  // Actually, let's do the insertion logic purely based on the machine transition in a `useEffect` that watches the state value.
  const previousStateValue = useRef(state.value);
  
  useEffect(() => {
      const wasGenerating = previousStateValue.current === 'generating';
      const isIdle = state.matches('idle');
      
      if (wasGenerating && isIdle && state.context.lastGeneratedText) {
          editorRef.current?.insertContent(state.context.lastGeneratedText);
      }
      
      previousStateValue.current = state.value;
  }, [state.value, state.context.lastGeneratedText, state]);


  const handleContinueWriting = () => {
    if (!editorRef.current) return;
    
    const currentText = editorRef.current.getContent();
    
    if (!currentText.trim()) {
        alert("Please type something first so the AI has context!");
        return;
    }

    send({ type: 'GENERATE', currentText });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
             <div className="bg-black text-white p-2 rounded-lg">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                </svg>
             </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Chronicle AI Editor
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Write, and let AI seamlessly continue your thoughts.
          </p>
        </div>

        {/* Error Banner */}
        {isError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {state.context.error || 'Something went wrong.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => send({ type: 'RETRY' })}
                className="text-sm font-medium text-red-600 hover:text-red-500 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Editor Container */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
          
          {/* Toolbar-like Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex space-x-2">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
            
            <button
              onClick={handleContinueWriting}
              disabled={isGenerating}
              className={`
                flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${isGenerating 
                  ? 'bg-indigo-400 cursor-not-allowed text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg active:scale-95'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner />
                  AI is writing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                  </svg>
                  Continue Writing
                </>
              )}
            </button>
          </div>

          {/* Editor Area */}
          <div className="p-8 md:p-12">
             <ProseMirrorEditor ref={editorRef} />
          </div>

          {/* Footer Status */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-2 flex justify-end text-xs text-gray-400">
             {isGenerating ? 'Thinking...' : 'Ready'}
          </div>
        </div>
        
        <p className="text-center text-sm text-gray-400">

        </p>
      </div>
    </div>
  );
};

export default App;
