import packageImages from '../../r-package-images.lock.json';
import { ChannelType, WebR, isRObject, type RObject, type Shelter } from 'webr';

export const WEBR_VERSION = '0.6.0';
const STARTUP_TIMEOUT_MS = 90_000;
const EXECUTION_TIMEOUT_MS = 30_000;

export type RuntimeSnapshot = {
  status: 'idle' | 'loading' | 'ready' | 'running' | 'error';
  generation: number;
  execution: number;
  message: string;
  startupMs?: number;
};

export type RunResult = {
  console: string;
  images: string[];
  error?: string;
  execution: number;
  generation: number;
  elapsedMs: number;
};

export class RuntimeCancelledError extends Error {
  constructor(message = 'Execution canceled. R objects were cleared; editor contents were kept.') {
    super(message);
    this.name = 'RuntimeCancelledError';
  }
}

class RuntimeTimeoutError extends Error {}
class RuntimePackageError extends Error {}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim() || 'R could not complete the request. Restart R and try again.';
}

async function conditionMessage(data: unknown): Promise<string> {
  if (typeof data === 'string') return data;
  // Ordinary R conditions store their human-readable text in the message field.
  if (isRObject(data)) {
    try {
      const message = await data.get('message');
      return await message.toString();
    } catch {
      // A user can signal a custom condition without the usual message field.
      return 'R signaled a condition without a readable message.';
    }
  }
  return String(data);
}

/** One worker survives navigation; each notebook has a separate R environment. */
export class RRuntime {
  private worker?: WebR;
  private initializing?: Promise<void>;
  private loadedPackages = new Set<string>();
  private environments = new Map<string, RObject>();
  private listeners = new Set<() => void>();
  private cancelPending = new Set<(reason: Error) => void>();
  private queue: Promise<void> = Promise.resolve();
  private queueEpoch = 0;
  private snapshot: RuntimeSnapshot = {
    status: 'idle', generation: 0, execution: 0, message: 'R starts when you open a notebook.',
  };

  getSnapshot = (): RuntimeSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(update: Partial<RuntimeSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...update };
    for (const listener of this.listeners) listener();
  }

  private assertCurrent(generation: number): void {
    if (generation !== this.snapshot.generation) throw new RuntimeCancelledError();
  }

  /** WebR close() terminates its worker but does not reject outstanding RPCs. */
  private async cancellable<T>(promise: Promise<T>, generation: number, timeoutMs: number, timeoutText: string): Promise<T> {
    this.assertCurrent(generation);
    let cancel!: (reason: Error) => void;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const canceled = new Promise<never>((_, reject) => { cancel = reject; });
    this.cancelPending.add(cancel);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new RuntimeTimeoutError(timeoutText)), timeoutMs);
    });
    try {
      const result = await Promise.race([promise, canceled, timeout]);
      this.assertCurrent(generation);
      return result;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      this.cancelPending.delete(cancel);
    }
  }

  start = (): Promise<void> => {
    if (this.initializing) return this.initializing;
    if (this.worker && (this.snapshot.status === 'ready' || this.snapshot.status === 'running')) {
      return Promise.resolve();
    }
    const promise = this.initialize(this.snapshot.generation);
    this.initializing = promise;
    // Do not let an older startup clear the promise for a replacement worker.
    void promise.then(
      () => { if (this.initializing === promise) this.initializing = undefined; },
      () => { if (this.initializing === promise) this.initializing = undefined; },
    );
    return promise;
  };

  private async initialize(generation: number): Promise<void> {
    const started = performance.now();
    this.publish({ status: 'loading', message: 'Loading R 4.6.0 in a background worker…', startupMs: undefined });
    let worker: WebR | undefined;
    try {
      worker = new WebR({
        baseUrl: new URL(`./webr/v${WEBR_VERSION}/`, document.baseURI).href,
        channelType: ChannelType.PostMessage,
      });
      this.worker = worker;
      const currentWorker = worker;
      const initialized = worker.init().then(async () => {
        // A worker may finish loading after a user canceled its startup.
        if (this.worker !== currentWorker || generation !== this.snapshot.generation) {
          currentWorker.close();
          throw new RuntimeCancelledError();
        }
        // Use the browser graphics device when captureR restores the initial null device.
        await currentWorker.evalRVoid('options(width = 88, device = webr::canvas)');
        const response = await fetch(new URL('./data/orders.csv', document.baseURI));
        if (!response.ok) throw new Error('The bundled orders.csv could not be loaded.');
        const bytes = new Uint8Array(await response.arrayBuffer());
        this.assertCurrent(generation);
        const workingDirectory = await currentWorker.evalRString('getwd()');
        await currentWorker.FS.mkdir(`${workingDirectory}/data`);
        await currentWorker.FS.writeFile(`${workingDirectory}/data/orders.csv`, bytes);
      });
      await this.cancellable(initialized, generation, STARTUP_TIMEOUT_MS,
        'R did not finish loading within 90 seconds. Check your connection and retry.');
      this.publish({
        status: 'ready', startupMs: performance.now() - started,
        message: 'R is ready. Chunks in this notebook share objects.',
      });
    } catch (error) {
      worker?.close();
      if (generation === this.snapshot.generation && this.worker === worker) {
        this.worker = undefined;
        this.publish({ status: 'error', message: `Could not start R. ${errorMessage(error)}` });
      }
      throw error;
    }
  }

  uploadCSV = async (bytes: Uint8Array): Promise<void> => {
    if (bytes.byteLength > 2 * 1024 * 1024) throw new Error('CSV exceeds 2 MiB.');
    await this.start();
    if (this.snapshot.status !== 'ready') throw new Error('Wait for R to finish before opening a CSV.');
    const generation = this.snapshot.generation;
    const worker = this.worker!;
    const directory = await worker.evalRString('getwd()');
    this.assertCurrent(generation);
    await worker.FS.writeFile(`${directory}/data/uploaded.csv`, bytes);
    this.assertCurrent(generation);
  };

  run = (notebookId: string, code: string, packages: readonly ('ggplot2')[] = []): Promise<RunResult> => {
    const generation = this.snapshot.generation;
    const epoch = this.queueEpoch;
    const pending = this.queue.then(async () => {
      this.assertCurrent(generation);
      if (epoch !== this.queueEpoch) throw new RuntimeCancelledError('Queued execution canceled after an earlier error.');
      try {
        return await this.execute(notebookId, code, generation, packages);
      } catch (error) {
        if (generation === this.snapshot.generation && !(error instanceof RuntimeCancelledError)) {
          this.queueEpoch++;
        }
        throw error;
      }
    });
    // Failed requests must not leave the next manually requested run blocked.
    this.queue = pending.then(() => undefined, () => undefined);
    return pending;
  };

  private async execute(notebookId: string, code: string, generation: number, packages: readonly ('ggplot2')[]): Promise<RunResult> {
    await this.start();
    this.assertCurrent(generation);
    const worker = this.worker!;
    const execution = this.snapshot.execution + 1;
    const started = performance.now();
    this.publish({ status: 'running', execution, message: `Running chunk [${execution}]…` });

    try {
      for (const name of packages) if (!this.loadedPackages.has(name)) {
        this.publish({ message: 'Loading ggplot2 and its bundled dependencies for this R session… Stop cancels loading.' });
        await this.cancellable(this.loadPlotPackages(worker, generation), generation, 120_000,
          'Package loading exceeded two minutes. R was restarted. Check your connection and run again.');
        this.loadedPackages.add(name);
        this.publish({ message: `Running chunk [${execution}]…` });
      }
      const captured = await this.cancellable(
        this.capture(worker, notebookId, code, generation), generation, EXECUTION_TIMEOUT_MS,
        'Execution exceeded 30 seconds. R was restarted to stop it. All R objects were cleared; editor contents were kept. Try fewer repetitions.',
      );
      if (captured.error) this.queueEpoch++;
      this.publish({
        status: 'ready', message: captured.error
          ? 'R reported an error. Later queued chunks were canceled. Fix the chunk and run again.'
          : `Finished chunk [${execution}].`,
      });
      return { ...captured, execution, generation, elapsedMs: performance.now() - started };
    } catch (error) {
      if (error instanceof RuntimeCancelledError || generation !== this.snapshot.generation) {
        throw new RuntimeCancelledError(errorMessage(error));
      }
      this.queueEpoch++;
      const message = errorMessage(error);
      if (error instanceof RuntimeTimeoutError || error instanceof RuntimePackageError) {
        // Recovery is independent of the abandoned capture promise.
        this.invalidate(message);
        void this.start().catch(() => { /* Loading failure is exposed in the snapshot. */ });
      } else {
        this.publish({ status: 'ready', message: `R could not finish this chunk. ${message}` });
      }
      return {
        console: '', images: [], error: message, execution, generation,
        elapsedMs: performance.now() - started,
      };
    }
  }

  private async loadPlotPackages(worker: WebR, generation: number): Promise<void> {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    this.cancelPending.add(cancel);
    let mounting = false;
    try {
      // Mount verified filesystem images; avoid R's archive extraction path.
      const images = [];
      const checked = async (file: string, expectedHash: string) => {
        const response = await fetch(new URL(`./r-packages/${file}`, document.baseURI), { signal: controller.signal });
        if (!response.ok) throw new Error(`Could not load plotting file ${file} (HTTP ${response.status}). Run again to retry.`);
        const bytes = await response.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        if (hash !== expectedHash) throw new Error(`Plotting file ${file} failed its integrity check. Reload and retry.`);
        this.assertCurrent(generation);
        return bytes;
      };
      for (const pkg of packageImages.images) {
        const data = await checked(pkg.data, pkg.sha256);
        const metadata = JSON.parse(new TextDecoder().decode(await checked(pkg.metadata, pkg.metadataSha256)));
        const blob = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))).blob();
        this.assertCurrent(generation);
        images.push({ blob, metadata });
      }
      mounting = true;
      await worker.FS.mkdir('/swr-plot-library');
      let offset = 0;
      const files = images.flatMap(({ blob, metadata }) => {
        const entries = metadata.files.map((file: { filename: string; start: number; end: number }) => ({
          ...file, start: file.start + offset, end: file.end + offset,
        }));
        offset += blob.size;
        return entries;
      });
      // WebR mounts each packages entry separately; one combined image avoids
      // attempting to mount several filesystems at the same mountpoint.
      await worker.FS.mount('WORKERFS', { packages: [{ blob: new Blob(images.map(image => image.blob)), metadata: { files } }] }, '/swr-plot-library');
      this.assertCurrent(generation);
      await worker.evalRVoid('.libPaths(c("/swr-plot-library", .libPaths()))');
      const version = await worker.evalRString('loadNamespace("ggplot2"); as.character(packageVersion("ggplot2"))');
      this.assertCurrent(generation);
      if (version !== '4.0.3') throw new Error('Expected bundled ggplot2 4.0.3. Restart R and retry.');
    } catch (error) {
      this.assertCurrent(generation);
      if (mounting) throw new RuntimePackageError(`Could not initialize plotting packages: ${errorMessage(error)} R was restarted; your code was kept. Run again to retry.`);
      throw error;
    } finally { this.cancelPending.delete(cancel); }
  }

  private async capture(worker: WebR, notebookId: string, code: string, generation: number): Promise<Pick<RunResult, 'console' | 'images' | 'error'>> {
    let shelter: Shelter | undefined;
    let bitmaps: ImageBitmap[] = [];
    try {
      let env = this.environments.get(notebookId);
      if (!env) {
        // Skip .GlobalEnv while retaining the standard statistics/graphics packages.
        env = await worker.evalR('new.env(parent = as.environment("package:stats"))');
        this.assertCurrent(generation);
        this.environments.set(notebookId, env);
      }
      shelter = await new worker.Shelter();
      this.assertCurrent(generation);
      const result = await shelter.captureR(code, {
        env, withAutoprint: true, captureStreams: true, captureConditions: true,
        throwJsException: false,
        captureGraphics: { width: 640, height: 400, bg: '#ffffff' },
      });
      bitmaps = result.images;
      this.assertCurrent(generation);
      const lines: string[] = [];
      const errors: string[] = [];
      for (const output of result.output) {
        const text = await conditionMessage(output.data);
        this.assertCurrent(generation);
        if (output.type === 'error') {
          errors.push(text);
          lines.push(`Error: ${text}`);
        } else if (output.type === 'warning') {
          lines.push(`Warning: ${text}`);
        } else {
          lines.push(text);
        }
      }
      const images = bitmaps.map((bitmap) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('This browser could not display the R plot. Try a current browser.');
        context.drawImage(bitmap, 0, 0);
        return canvas.toDataURL('image/png');
      });
      return { console: lines.join('\n'), images, ...(errors.length ? { error: errors.join('\n') } : {}) };
    } finally {
      for (const bitmap of bitmaps) bitmap.close();
      // Purging a terminated worker would wait forever; the worker owns that memory.
      if (shelter && generation === this.snapshot.generation && this.worker === worker) {
        await shelter.purge();
      }
    }
  }

  private invalidate(message: string): void {
    this.queueEpoch++;
    const oldWorker = this.worker;
    const cancellations = [...this.cancelPending];
    this.cancelPending.clear();
    this.worker = undefined;
    this.initializing = undefined;
    this.environments.clear();
    this.loadedPackages.clear();
    this.queue = Promise.resolve();
    this.publish({
      status: 'idle', generation: this.snapshot.generation + 1, execution: 0,
      startupMs: undefined, message,
    });
    for (const cancel of cancellations) cancel(new RuntimeCancelledError(message));
    oldWorker?.close();
  }

  restart = async (): Promise<void> => {
    this.invalidate('Restarting R. All R objects were cleared; editor contents were kept.');
    await this.start();
  };

  stop = async (): Promise<void> => {
    this.invalidate('Stopped execution and cleared all R objects. Editor contents were kept.');
    await this.start();
  };

  shutdown = (): void => {
    this.invalidate('R was shut down. Editor contents were kept.');
  };
}

export const runtime = new RRuntime();
