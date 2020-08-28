import path from "path";
import { EventEmitter } from 'events'
import progress from "progress";
import parents from 'parents'
import { sizeConversion } from "@/utils";
import { FtpOptions, SFtpOptions } from "@/interface";
import { log } from "@/utils";
import { scanDir } from "@/internal/scandir";
import { Queue } from "@/internal/queue";
import { isFile } from '@/internal/fs-promise'
interface IObject {
  [key: string]: boolean
}
type options = FtpOptions | SFtpOptions
interface CallBackOptions {
  tick?: (err: any, filename: string) => void
}
export abstract class BaseClient extends EventEmitter {
  public connected: boolean = false;
  public options: options;
  public files: string[] = [];
  public totalSize: number = 0;
  public cacheDir: IObject = {};
  public isSingleFile: boolean = false;
  constructor(options: options) {
    super()
    this.options = options;
  }
  abstract connect(opts: options): Promise<boolean>
  abstract mkdir(path: string): Promise<string>;
  abstract uploadFile(localPath: string, remotePath: string): Promise<string>
  abstract destroy(): void;
  async start() {
    try {
      let connected = await this.connect(this.options)
      this.connected = connected;
      this.upload();
    } catch (_) {
      log.error(`[start] => ${_}`)
    }
  }
  getRemotePath(path: string): string {
    if (this.isSingleFile) return path
    let rootDir = path.replace(this.options.sourcePath, '');
    let remoteDir = `${this.options.remotePath}${rootDir}`
    return remoteDir;
  }
  async upload() {
    try {
      if (await isFile(this.options.sourcePath)) {
        this.isSingleFile = true;
        this.handlerSingleFile();
        return;
      }
      let { total, dirs, files } = await scanDir(this.options.sourcePath);
      if (files.length && this.connected) {
        log.info(`FILE COUNT: ${files.length} DIRECTORY COUNT: ${dirs.length} TOTAL SIZE:${sizeConversion(total)}`)
        this.progress(files.length)
        dirs.sort((a, b) => a.length - b.length)
        await this.uploadDirectory(dirs)
        await this.uploadFiles(files, {
          tick: (err, fileName) => {
            if (err) return log.error(err);
            this.emit("progress", fileName)
          }
        })
      }
    } catch (_) {
      log.error(_);
      this.emit("error", _)
    }

  }
  async handlerSingleFile() {
    let dirs = parents(this.options.remotePath).sort((a, b) => a.length - b.length);
    let file = `${this.options.remotePath}/${path.basename(this.options.sourcePath)}`;
    try {
      await this.uploadDirectory(dirs);
      await this.uploadFile(this.options.sourcePath, file);
      this.emit("complete")
    } catch (_) {
      this.emit("error", _)
      log.error(_)
    }
  }
  uploadDirectory(dirs: string[]): Promise<void> {
    const queue = new Queue({ concurrency: 20 });
    return new Promise((resolve, reject) => {
      dirs.forEach(dir => {
        if (!dir) return;
        queue.add(async () => {
          await this.mkdir(this.getRemotePath(dir)).catch(reject)
        })
      })
      resolve(queue.waitTillIdle())
    })

  }
  uploadFiles(files: string[], { tick }: CallBackOptions): Promise<void> {
    const queue = new Queue({ concurrency: 20 });
    return new Promise((resolve, reject) => {
      files.forEach(file => {
        queue.add(async () => {
          await this.uploadFile(file, this.getRemotePath(file))
          if (tick) tick(null, file)
        }).catch((_) => {
          if (tick) tick(_, file)
          reject(_)
        })
      })
      resolve(queue.waitTillIdle())
    })
  }
  progress(total: number) {
    let bar = new progress("uploading [:bar] :percent :current/:total :elapseds :file", {
      total,
      width: 40,
    })
    this.on("progress", name => {
      bar.tick({
        file: path.basename(name)
      })
      if (bar.complete) {
        this.emit("complete")
      }
    })
  }
}

