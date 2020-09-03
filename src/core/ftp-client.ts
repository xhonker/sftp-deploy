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
  async connect(opts: FtpOptions) {
    if (os.platform() !== 'darwin') throw new Error("not support platform")
    this.client.Hostname = opts.host;
    this.client.Username = opts.username;
    this.client.Password = opts.password;
    this.client.Passive = this.passive;
    this.client.Port = opts.port;
    this.client.ConnectTimeout = 0;

    try {
      const success = this.client.Connect();
      if (!success) throw new Error(this.client.LastErrorText);
    } catch (_) {
      throw new Error(`[FTP] connect ${_}`)
    }
  }
  async uploadFile(localPath: string, remotePath: string) {
    await this.execute(() => this.client.PutFile(localPath, remotePath), this.fileChmod(remotePath)).catch(_ => { throw new Error(`[FTP] uploadFile ${_}`) })
  }
  async mkdir(path: string) {
    await this.execute(() => this.client.CreateRemoteDir(path), this.fileChmod(path)).catch(_ => { throw new Error(`[FTP] mkdir ${_}`) })
  }
  async execute(fn: Function, command: string) {
    let result = fn();
    if (!result && typeof result === 'string' && !!~result.search("failed")) throw new Error(this.client.LastErrorText);
    await this.sendCommand(command).catch(_ => { throw new Error(`[FTP] execute ${_}`) })
  }
  fileChmod(path: string) {
    return `SITE CHMOD 777 ${path}`;
  }
  async sendCommand(cmd: string) {
    if (!this.isChangeChmod) return;

    try {
      const rep = this.client.SendCommand(cmd);
      if (!rep && typeof this.client.LastErrorText === 'string' && !!~this.client.LastErrorText.search('command not understood')) return this.isChangeChmod = false;
      if (!rep) throw new Error(this.client.LastErrorText)
    } catch (_) {
      throw new Error(`[FTP] sendCommand ${_}`)
    }
  }
  destroy() {
    if (this.client) {
      this.client.Disconnect();
      this.client = void 0;
    }
  }
}