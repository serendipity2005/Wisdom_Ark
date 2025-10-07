type SuggestionMode = 'insert' | 'replace' | 'replace_all';

export interface AISuggestion {
  id: string;
  text: string;
  mode: SuggestionMode;
  // insert at a position (used when mode === 'insert')
  position?: number;
  // replace range (used when mode === 'replace')
  range?: { from: number; to: number };
}

type Listener = (s: AISuggestion | null) => void;

export class AISuggestionBus {
  private static instance: AISuggestionBus | null = null;
  private current: AISuggestion | null = null;
  private listeners = new Set<Listener>();

  static getInstance(): AISuggestionBus {
    if (!AISuggestionBus.instance) {
      AISuggestionBus.instance = new AISuggestionBus();
    }
    return AISuggestionBus.instance;
  }

  get(): AISuggestion | null {
    return this.current;
  }

  show(suggestion: AISuggestion) {
    this.current = suggestion;
    this.emit();
  }

  clear() {
    this.current = null;
    this.emit();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.current);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    for (const l of this.listeners) {
      try {
        l(this.current);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

export default AISuggestionBus;
