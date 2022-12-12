declare namespace NodeJS {
  interface Process {
    log: (...args: string[]) => void;
  }
}
