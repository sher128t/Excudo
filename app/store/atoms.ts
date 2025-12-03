import { atom } from "jotai";

export const selectedFileAtom = atom<string | null>(null);
export const fileContentAtom = atom<string>("");
