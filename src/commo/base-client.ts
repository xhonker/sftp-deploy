import path from "path";
import fs from "fs-extra";
import { EventEmitter } from 'events'
import chalk from "chalk";
import progress from "progress";
import { sizeConversion } from "@/utils";
import { FtpOptions, SFtpOptions } from "@/interface";

type options = FtpOptions | SFtpOptions
export abstract class BaseClient extends EventEmitter {
  public client: any;
  public connected: boolean = false;
  public options: options;
  public files: string[] = [];
  public totalSize: number = 0;
  constructor(options: options) {
    super()
    this.options = options;
  }
  abstract mkdir(path: string): Promise<void>;
  abstract put(path: string, data: string | Buffer | NodeJS.ReadableStream): Promise<boolean>;
  abstract connect(opts: options): Promise<boolean>
  async start() {
    try {
      let connected = await this.connect(this.options)
      this.connected = connected;
      this.handlerDir(this.options.sourcePath)
      if (!this.files.length) return console.log("directory is empty")
      if (!this.connected) return console.log("ftp connect is fail, please retry")
      if (this.files.length && this.connected) {
        console.log(chalk.blueBright(`FILE COUNT: ${this.files.length} TOTAL SIZE:${sizeConversion(this.totalSize)}`));
        this.progress(this.files.length)
        for await (const file of this.files) {
          this.uploadFiles(file)
        }
      }
    } catch (_) {
      console.log(chalk.redBright('[ftp connect err] :', _))
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
  async uploadFiles(filePath: string) {
    let basePath = filePath.replace(this.options.sourcePath, '');
    let destPath = `${this.options.remotePath}${basePath}`;
    let fileStream = fs.readFileSync(filePath);

    try {
      await this.put(destPath, fileStream);
      this.emit("progress", filePath)
    } catch (_) {
      if (_.code !== 550) return this.emit("err", _)

      await this.mkdir(path.parse(destPath).dir)
      this.uploadFiles(filePath)
    }
  }
  progress(total: number) {
    let bar = new progress("[:bar] :current/:total :elapseds uploading :file", {
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

