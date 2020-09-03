
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
  async connect(opts: SFtpOptions) {
    try {
      await this.client.connect(opts)
      this.sftp = await this.client.requestSFTP();
    } catch (_) {
      throw new Error(`[sftp] connect ${_}`);
    }
  }
  async uploadFile(localPath: string, remotePath: string) {
    await this.client.putFile(localPath, remotePath, this.sftp).catch(_ => { throw new Error(`[sftp] uploadFile, path=${remotePath} ${_}`) })
  }
  async mkdir(remotePath: string) {
    await this.client.mkdir(remotePath, 'sftp', this.sftp).catch(_ => { throw new Error(`[sftp] mkdir, path=${remotePath} ${_}`); })
  }
  destroy() {
    if (this.sftp) {
      this.sftp.end();
      this.sftp = void 0;
    }
  }
}