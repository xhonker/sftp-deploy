import fs from "fs-extra";
import Client from "ftp";
import os from "os";
//@ts-ignore
import { Ftp2 } from '@chilkat/ck-node11-macosx';
import { BaseClient } from "./base-client";
import { FtpOptions } from "@/interface/index";

export class FtpClient extends BaseClient {
  public client: any;
  public passive: boolean = true;
  constructor(options: FtpOptions) {
    super(options);
    this.passive = options.passive!
    this.client = this.passive ? new Client() : new Ftp2();
    this.start()
  }
  connect(opts: FtpOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.passive) {
        if (os.platform() !== 'darwin') return reject("not support platform")
        this.client.Hostname = opts.host;
        this.client.Username = opts.user;
        this.client.Password = opts.password;
        this.client.Passive = this.passive;
        const success = this.client.Connect();
        if (!success) reject(this.client.LastErrorText);
        resolve(true);
        return;
      }
      this.client!.connect(opts)
      this.client!.on("ready", (err: any) => {
        if (err) return reject(err);
        resolve(true);
      })
      this.client!.on("error", (err: any) => {
        reject(err)
      })
    })
  }
  uploadFile(localPath: string, remotePath: string): Promise<string> {
    return new Promise((result, reject) => {
      if (!this.passive) {
        let success = this.client.PutFile(localPath, remotePath);
        let rep = this.client.SendCommand(`SITE CHMOD 777 ${remotePath}`)
        if (!success || !rep) return reject(this.client.LastErrorText)
        return result(remotePath)
      }
      let data = fs.readFileSync(localPath)
      this.client!.put(data, remotePath, (err: any) => {
        if (err) return reject(err)
        result(remotePath);
      })
    })
  }
  mkdir(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.passive) {
        let success = this.client.CreateRemoteDir(path);
        let rep = this.client.SendCommand(`SITE CHMOD 777 ${path}`);
        if (!success || !rep) return reject(this.client.LastErrorText)
        return resolve(path)
      }
      this.client!.mkdir(path, true, (err: any) => {
        if (err) return reject(err)
        resolve(path)
      })
    })
  }
  destroy() {
    if (this.client) {
      if (!this.passive) return this.client.Disconnect();
      this.client!.destroy();
      this.client = void 0;
    }
  }
}