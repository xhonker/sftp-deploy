import path from "path";
import { EventEmitter } from 'events'
import progress from "progress";
import { sizeConversion } from "@/utils";
import { FtpOptions, SFtpOptions } from "@/interface";
import { log } from "@/utils";
import { scanDir } from "@/scandir";
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
  constructor(options: options) {
    super()
    this.options = options;
  }
  abstract connect(opts: options): Promise<boolean>
  abstract putDirectorys(dirs: string[], options?: CallBackOptions): Promise<void>
  abstract putFiles(files: string[], options?: CallBackOptions): Promise<void>;
  async start() {
    try {
      let connected = await this.connect(this.options)
      this.connected = connected;
      let { total, dirs, files } = await scanDir(this.options.sourcePath);
      if (files.length && this.connected) {
        log.info(`FILE COUNT: ${files.length} DIRECTORY COUNT: ${dirs.length} TOTAL SIZE:${sizeConversion(total)}`)
        this.progress(files.length)
        await this.putDirectorys(dirs.sort((a, b) => a.length - b.length)).catch(_ => log.error(_))

        this.putFiles(files, {
          tick: (err, fileName) => {
            if (err) return log.error(err);
            this.emit("progress", fileName)
          }
        }).catch(_ => log.error(_))
      }
    } catch (_) {
      log.error(`[start] => ${_}`)
    }
  }
  getFilePath(path: string): string[] {
    let rootDir = path.replace(this.options.sourcePath, '');
    let remoteDir = `${this.options.remotePath}${rootDir}`
    return [
      rootDir,
      remoteDir
    ]
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
        log.success("deploy successed")
        process.exit(0)
      }
    })
  }
}

