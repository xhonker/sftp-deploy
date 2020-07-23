import Client from "ftp";
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
  async put(path: string, data: any): Promise<boolean> {
    return new Promise((result, reject) => {
      this.client.put(data, path, (err) => {
        if (err) reject(err)
        result(true);
      })
    })
  }
  async mkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.mkdir(path, true, err => {
        this.client.end();
        if (err) reject(err)
        resolve()
      })
    })
  }
}