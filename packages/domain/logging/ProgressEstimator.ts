import { formatDistance } from "date-fns";

class ProgressEstimator {
  private start: number;
  private total: number;
  private processed: number;

  constructor(total: number) {
    this.start = Date.now();
    this.total = total;
    this.processed = 0;
  }

  public get numProcessed() {
    return this.processed;
  }

  public get progress() {
    return (this.numProcessed / this.total) * 100;
  }

  public logItemProcessed(number = 1) {
    this.processed += number;
  }

  public getAverageTimePerItem() {
    const now = Date.now();
    const elapsed = now - this.start;
    return this.processed > 0 ? elapsed / this.processed : 0;
  }

  public getAverageTimePerItemString() {
    const averageTimePerItem = this.getAverageTimePerItem();
    return (
      formatDistance(averageTimePerItem, 0, { includeSeconds: true }) + " per item"
    );
  }

  public getElapsed() {
    return Date.now() - this.start;
  }

  public getElapsedString() {
    const elapsed = this.getElapsed();
    return formatDistance(elapsed, 0, { includeSeconds: true }) + " elapsed";
  }

  public getETA() {
    const now = Date.now();
    const elapsed = now - this.start;
    const averageTimePerItem = elapsed / this.processed;
    const remainingItems = this.total - this.processed;
    const remainingTime = remainingItems * averageTimePerItem;
    return remainingTime;
  }

  public getETAString() {
    const eta = this.getETA();
    const etaDate = new Date(Date.now() + eta);
    return formatDistance(etaDate, new Date(), { includeSeconds: true }) + " remaining";
  }

  public toString() {
    return (
      `Processed ${this.processed} of ${this.total} items ` +
      `| ${this.progress.toFixed(2)}% ` +
      `| ${this.getElapsedString()} ` +
      `| ${this.getAverageTimePerItemString()} | ${this.getETAString()}`
    );
  }
}

export default ProgressEstimator;
