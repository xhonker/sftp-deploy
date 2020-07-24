import path from "path";
import parents from "parents";
import fs from "fs-extra";
import Client from "ftp";
import { whilst } from "async";
import { BaseClient } from "./base-client";
import { FtpOptions } from "@/interface/index";

export class FtpClient extends BaseClient {

  public client: Client;
  constructor(options: FtpOptions) {
    super(options);
    this.client = new Client();
    this.start()
  }
  async connect(opts: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.connect(opts)
      this.client.on("ready", (err) => {
        if (err) return reject(err);
        resolve(true);
      })
      this.client.on("error", err => {
        reject(err)
      })
    })
  }
  async put(path: string, data: fs.ReadStream): Promise<boolean> {
    return new Promise((result, reject) => {
      this.client.put(data, path, (err) => {
        if (err) return reject(err)
        result(true);
      })
    })
  }
  async mkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.mkdir(path, true, err => {
        this.client.end();
        if (err) return reject(err)
        resolve()
      })
    })
  }
  async uploadFiles(files: string[]): Promise<void> {
    for await (const file of files) {
      let basePath = file.replace(this.options.sourcePath, '');
      let destPath = `${this.options.remotePath}${basePath}`;
      let fileDirs = parents(path.dirname(destPath));
      fileDirs = fileDirs.filter(d => !this.cacheDir[d])
      // @ts-ignore
      whilst(cb => cb(null, fileDirs && fileDirs.length), async (next) => {
        let d = fileDirs.pop()!;
        this.cacheDir[d] = true;
        await this.mkdir(d).catch(e => { console.log('mkdir', e) })
        next()
      }, async (err: any) => {
        if (err) return console.log(err);
        let fileStream = fs.createReadStream(file);
        await this.put(destPath, fileStream).catch(e => { console.log('create', e) })
        this.emit("progress", path.basename(file))
      })
    }
  }
}