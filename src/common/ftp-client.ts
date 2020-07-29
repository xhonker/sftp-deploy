import parents from "parents";
import fs from "fs-extra";
import Client from "ftp";
import { BaseClient } from "./base-client";
import { FtpOptions } from "@/interface/index";
import { Queue } from "@/internal/queue";

export class FtpClient extends BaseClient {

  public client: Client;
  constructor(options: FtpOptions) {
    super(options);
    this.client = new Client();
    this.start()
  }
  async connect(opts: FtpOptions): Promise<boolean> {
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
  async put(path: string, data: Buffer): Promise<string> {
    return new Promise((result, reject) => {
      this.client.put(data, path, (err) => {
        if (err) return reject(err)
        result(path);
      })
    })
  }
  async mkdir(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.mkdir(path, true, err => {
        if (err) return reject(err)
        resolve(path)
      })
    })
  }
  async putDir(dirPath: string) {
    return new Promise(async (resolve, reject) => {
      let fileDirs = parents(dirPath);
      fileDirs = fileDirs.filter(d => !this.cacheDir[d])
      for await (const dir of fileDirs) {
        this.cacheDir[dir] = true
        this.mkdir(dir).catch(_ => { reject(_) })
      }
      resolve()
    })
  }
  async putDirectorys(dirs: string[]): Promise<void> {
    let queue = new Queue({ concurrency: 10 })
    return new Promise(async (resolve, reject) => {
      dirs.forEach(dir => {
        let [, remotePath] = this.getFilePath(dir);
        queue.add(async () => {
          try {
            await this.putDir(remotePath)
          } catch (_) {
            reject(_)
          }
        }).catch(reject)
      })
      resolve(queue.waitTillIdle())
    })
  }
  async putFiles(files: string[], { tick }: any): Promise<void> {
    let queue = new Queue()
    return new Promise((resolve, reject) => {
      files.forEach(file => {
        let [, remotePath] = this.getFilePath(file);
        let fileStream = fs.readFileSync(file)
        queue.add(async () => {
          try {
            await this.put(remotePath, fileStream)
            if (tick) tick(null, remotePath)
          } catch (_) {
            if (tick) tick(_, remotePath)
          }
        }).catch(reject)
      })
      resolve(queue.waitTillIdle())
    })
  }
}