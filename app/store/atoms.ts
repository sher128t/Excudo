import { atom } from 'jotai';

export const selectedFileAtom = atom<string | null>(null);
export const fileContentAtom = atom<string>('');

// Set by Preview ("Fix with AI") with captured build error text;
// consumed by ChatInterface which sends it to the AI.
export const fixRequestAtom = atom<string | null>(null);
