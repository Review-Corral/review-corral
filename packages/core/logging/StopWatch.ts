import { Logger } from ".";

const LOGGER = new Logger("StopWatch");

export default class StopWatch {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  public getLapTime(currentTime = Date.now()): number {
    return currentTime - this.startTime;
  }

  public lapAndLog(label: string) {
    const currentTime = Date.now();
    const lapTime = this.getLapTime(currentTime);
    LOGGER.debug(`Execution time for "${label}": ${lapTime}ms`);
    this.startTime = currentTime;
  }
}
