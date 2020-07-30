
import SSH from "node-ssh";
import { BaseClient } from "./base-client";
import { SFtpOptions } from "@/interface";
import { SFTPWrapper } from "ssh2";

export class SftpClient extends BaseClient {
  public client: SSH;
  public sftp: SFTPWrapper | undefined;
  constructor(options: SFtpOptions) {
    super(options)
    this.client = new SSH();
    this.start();
  }
  async connect(opts: SFtpOptions): Promise<boolean> {
    try {
      await this.client.connect(opts)
      this.sftp = await this.client.requestSFTP();
      return true
    } catch (_) {
      throw `[sftp] connect ${_}`
    }
  }
  async uploadFile(localPath: string, remotePath: string): Promise<string> {
    try {
      await this.client.putFile(localPath, remotePath, this.sftp)
      return localPath
    } catch (_) {
      throw `[sftp] uploadFile, path=${remotePath} ${_}`
    }

  }
  async mkdir(remotePath: string): Promise<string> {
    try {
      await this.client.mkdir(remotePath, 'sftp', this.sftp)
      return remotePath
    } catch (_) {
      throw `[sftp] mkdir, path=${remotePath} ${_}`
    }
  }
  destroy() {
    if (this.sftp) {
      this.sftp.end();
      this.sftp = void 0;
    }
  }
}