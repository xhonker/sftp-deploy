import path from "path";
import fs from "fs-extra";
import { EventEmitter } from 'events'
import chalk from "chalk";
import progress from "progress";
import { sizeConversion } from "@/utils";
import { FtpOptions, SFtpOptions } from "@/interface";
import { log } from "@/utils";

interface IObject {
  [key: string]: boolean
}
type options = FtpOptions | SFtpOptions
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
  abstract uploadFiles(files: string[]): Promise<void>;
  abstract connect(opts: options): Promise<boolean>
  async start() {
    try {
      let connected = await this.connect(this.options)
      this.connected = connected;
      this.handlerDir(this.options.sourcePath)
      if (this.files.length && this.connected) {
        log.info(`FILE COUNT: ${this.files.length} TOTAL SIZE:${sizeConversion(this.totalSize)}`)
        this.progress(this.files.length)
        await this.uploadFiles(this.files);
      }
    } catch (_) {
      log.error(`[start] => ${_}`)
    }
  }
  async handlerDir(sourcePath: string) {
    let files = fs.readdirSync(sourcePath).map(file => `${sourcePath}/${file}`)
    files.forEach(file => {
      let fileStat = fs.statSync(file);
      this.totalSize += fileStat.size;
      if (fileStat.isFile()) return this.files.push(file)
      this.handlerDir(file);
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
        console.log(chalk.greenBright("deploy successed"))
        process.exit(0)
      }
    })
  }
}

