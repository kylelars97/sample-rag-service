export interface Fact {
  readonly id: string;
  readonly text: string;
  readonly sourceSection?: string;
  readonly tags?: readonly string[];
}

export interface EmbeddedFact extends Fact {
  readonly embedding: readonly number[];
}

export interface QueryResult {
  readonly answer: string;
  readonly facts: readonly string[];
}