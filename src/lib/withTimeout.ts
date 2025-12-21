export async function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage = "Operation timed out") {
  let timer: NodeJS.Timeout;
  return Promise.race<T>([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, ms);
    }),
  ]);
}
