declare namespace NodeJS {
  interface Process {
    log: (...args: string[]) => void;
  }
}

declare module "is-absolute" {
  export default function isAbsolute(path: string): boolean;
  export function posix(path: string): boolean;
  export function win32(path: string): boolean;
}
