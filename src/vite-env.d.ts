/// <reference types="vite/client" />

/*
FILE REFERENCE:

This file is to stop red squiggly line under .env when we are importing local variables using vite
import.meta.env.VITE_DEEPSEEK_API_KEY
That red squiggly line is a TypeScript typing issue, not a runtime issue.
Your code runs fine, but TypeScript doesn’t know about your custom Vite env variables yet.

This is very common in Vite + TS projects.

Vite exposes import.meta.env, but TypeScript doesn’t know about your custom keys.
So TS complains with:
 */


interface ImportMetaEnv {
  readonly VITE_DEEPSEEK_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
