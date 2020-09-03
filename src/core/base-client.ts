import path from "path";
import { EventEmitter } from 'events'
import progress from "progress";
import parents from 'parents'
import { sizeConversion, log } from "@/utils";
import { scanDir } from "@/internal/scandir";
import { Queue } from "@/internal/queue";
import { isFile } from '@/internal/fs-promise'
import { FtpOptions, SFtpOptions } from "@/interface";

type options = FtpOptions | SFtpOptions

export abstract class BaseClient extends EventEmitter {
  public connected: boolean = false;
  public options: options;
  public isSingleFile: boolean = false;
  constructor(options: options) {
    super()
    this.options = options;
  }
  abstract async connect(opts: options): Promise<any>;
  abstract async mkdir(path: string): Promise<any>;
  abstract async uploadFile(localPath: string, remotePath: string): Promise<any>
  abstract destroy(): void;
  async start() {
    try {
      await this.connect(this.options)
      this.connected = true;
      await this.upload();
    } catch (_) {
      log.error(`[START] ${_}`)
    } finally {
      this.destroy();
    }
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
        this.progressFile(files.length)
        dirs.sort((a, b) => a.length - b.length)
        await this.uploadDirectory(dirs)
        await this.uploadFiles(files)
      }
    } catch (_) {
      log.error(`[base] upload ${_}`);
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
      log.error(`[base] singleFile ${_}`)
      this.emit("error", _)
    }
  }
  uploadDirectory(dirs: string[]): Promise<void> {
    const queue = new Queue({ concurrency: 1 });
    return new Promise((resolve, reject) => {
      dirs.forEach(dir => {
        if (!dir) return;
        queue.add(async () => {
          await this.mkdir(this.getRemotePath(dir)).catch(reject)
          this.emit("progressDir", dir)
        })
      })
      resolve(queue.waitTillIdle())
    })

  }
  async uploadFiles(files: string[]): Promise<void> {
    const queue = new Queue({ concurrency: 1 });
    return new Promise((resolve, reject) => {
      files.forEach(filePath => {
        queue.add(async () => {
          await this.uploadFile(filePath, this.getRemotePath(filePath)).catch(reject)
          this.emit("progressFile", filePath)
        })
      })
      resolve(queue.waitTillIdle())
    })
  }
  getRemotePath(path: string): string {
    if (this.isSingleFile) return path
    let rootDir = path.replace(this.options.sourcePath, '');
    let remoteDir = `${this.options.remotePath}${rootDir}`
    return remoteDir;
  }
  progressFile(total: number) {
    let bar = new progress("uploading File [:bar] :percent :current/:total :elapseds :file", {
      total,
      width: 40,
    })
    this.on("progressFile", name => {
      bar.tick({
        file: path.basename(name)
      })
      if (bar.complete) {
        this.emit("complete")
      }
    })
  }
}

