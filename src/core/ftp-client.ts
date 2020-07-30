import fs from "fs-extra";
import Client from "ftp";
import { BaseClient } from "./base-client";
import { FtpOptions } from "@/interface/index";

export class FtpClient extends BaseClient {
  public client: Client | undefined;
  constructor(options: FtpOptions) {
    super(options);
    this.client = new Client();
    this.start()
  }
  connect(opts: FtpOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client!.connect(opts)
      this.client!.on("ready", (err) => {
        if (err) return reject(err);
        resolve(true);
      })
      this.client!.on("error", err => {
        reject(err)
      })
    })
  }
  uploadFile(localPath: string, remotePath: string): Promise<string> {
    return new Promise((result, reject) => {
      let data = fs.readFileSync(localPath)
      this.client!.put(data, remotePath, (err) => {
        if (err) return reject(err)
        result(remotePath);
      })
    })
  }
  mkdir(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client!.mkdir(path, true, err => {
        if (err) return reject(err)
        resolve(path)
      })
    })
  }
  destroy() {
    if (this.client) {
      this.client!.destroy();
      this.client = void 0;
    }
  }
}