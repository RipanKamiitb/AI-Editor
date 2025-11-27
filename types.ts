export interface EditorHandle {
  getContent: () => string;
  insertContent: (text: string) => void;
  focus: () => void;
}

// XState Types
export interface EditorContext {
  error: string | null;
  lastGeneratedText: string | null;
}

export type EditorEvent =
  | { type: 'GENERATE'; currentText: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// We define the input structure for the machine services
export interface GenerateTextServiceInput {
  currentText: string;
}
