import os from "os";
//@ts-ignore
import { Ftp2 } from '@chilkat/ck-node11-macosx';
import { BaseClient } from "./base-client";
import { FtpOptions } from "@/interface/index";

export class FtpClient extends BaseClient {
  public client: any;
  public passive: boolean = true;
  public isChangeChmod: boolean = true;
  constructor(options: FtpOptions) {
    super(options);
    this.client = new Ftp2();
    if (typeof options.passive === 'boolean') {
      this.passive = options.passive!
    }
    this.start()
  }
  connect(opts: FtpOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (os.platform() !== 'darwin') return reject("not support platform")
      this.client.Hostname = opts.host;
      this.client.Username = opts.user;
      this.client.Password = opts.password;
      this.client.Passive = this.passive;
      this.client.Port = opts.port;
      this.client.ConnectTimeout = 0;
      const success = this.client.Connect();
      if (!success) reject(this.client.LastErrorText);
      resolve(true);
    })
  }
  uploadFile(localPath: string, remotePath: string): Promise<string> {
    return new Promise(async (result, reject) => {
      try {
        await this.execute(() => this.client.PutFile(localPath, remotePath), this.fileChmod(remotePath))
        result(remotePath)
      } catch (_) {
        reject(_)
      }
    })
  }
  mkdir(path: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.execute(() => this.client.CreateRemoteDir(path), this.fileChmod(path))
        resolve(path)
      } catch (_) {
        reject(_)
      }
    })
  }
  execute(fn: Function, command: string) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = fn();
        if (!result && typeof result === 'string' && !!~result.search("failed")) return reject(this.client.LastErrorText);
        await this.sendCommand(command)
        resolve();
      } catch (_) {
        reject(_)
      }
    })
  }
  fileChmod(path: string) {
    return `SITE CHMOD 777 ${path}`;
  }
  sendCommand(cmd: string) {
    return new Promise(async (resolve, reject) => {
      if (!this.isChangeChmod) return resolve();
      const rep = this.client.SendCommand(cmd);
      if (!rep && typeof this.client.LastErrorText === 'string' && !!~this.client.LastErrorText.search('command not understood')) {
        this.isChangeChmod = false;
        return resolve();
      } else if (!rep) {
        reject(this.client.LastErrorText)
      } else {
        resolve()
      }
    })
  }
  destroy() {
    if (this.client) {
      this.client.Disconnect();
      this.client = void 0;
    }
  }
}