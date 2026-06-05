import { writable } from "svelte/store";

export type PlayerMode =
  | { type: "human-vs-human" }
  | { type: "human-vs-engine"; engineSide: "w" | "b" };

export const mode = writable<PlayerMode>({
  type: "human-vs-human",
});
