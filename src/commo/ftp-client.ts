import Client from "ftp";
import path from 'path';
import { EventEmitter } from "events";
import fs from "fs-extra";
import chalk from "chalk";
import progress from "progress";
import { sizeConversion } from "@/utils";
import { FtpOptions } from "@/interface/index";

export class FtpClient extends EventEmitter {
  public client: Client;
  public connected: boolean = false;
  public options: FtpOptions;
  constructor(options: FtpOptions) {
    super();
    this.options = options;
    this.client = new Client();
    this.start(options.sourcePath)
  }

  log() {
    this.on('log', e => console.log(e))
  }
  async connect(opts: FtpOptions) {
    return new Promise((resolve, reject) => {
      this.client.connect(opts)
      this.client.on("ready", (err) => {
        if (err) return reject(err);
        this.connected = true;
        resolve();
      })
      this.client.on("error", err => {
        reject(err)
      })
    })
  }


  async start(sourcePath: string) {
    this.emit("log", 'start')
    try {
      await this.connect(this.options)
    } catch (_) {
      console.log(chalk.redBright('[ftp connect err] :', _))
    }

    let items: string[] = [];
    let totalSize = 0;
    await handlerFiles(sourcePath);

    async function handlerFiles(sourcePath: string) {
      let files = fs.readdirSync(sourcePath).map(file => `${sourcePath}/${file}`)
      files.forEach(file => {
        let fileStat = fs.statSync(file);
        totalSize += fileStat.size;
        if (fileStat.isFile()) return items.push(file)
        handlerFiles(file);
      })
    }

    if (items.length && this.connected) {
      console.log(chalk.blueBright(`FILE COUNT: ${items.length} TOTAL SIZE:${sizeConversion(totalSize)}`));
      this.emit("log", items)
      this.progress(items.length)
      for await (const filePath of items) {
        this.upload(filePath)
      }
    } else {
      this.emit("err", 'ftp is not connect, please retry')
    }
  }
  async upload(filePath: string) {

    let basePath = filePath.replace(this.options.sourcePath, '');
    let destPath = `${this.options.remotePath}${basePath}`;
    let fileStream = fs.readFileSync(filePath);

    try {
      await this.put(fileStream, destPath);
      this.emit("progress", filePath)
    } catch (_) {
      if (_.code !== 550) return this.emit("err", _)

      await this.mkdir(path.parse(destPath).dir)
      this.upload(filePath)
    }
  }
  async put(data: any, path: string) {
    return new Promise((result, reject) => {
      this.client.put(data, path, (err) => {
        if (err) reject(err)
        result();
      })
    })
  }
  async mkdir(path: string) {
    return new Promise((resolve, reject) => {
      this.client.mkdir(path, true, err => {
        this.client.end();
        if (err) reject(err)
        resolve()
      })
    })
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