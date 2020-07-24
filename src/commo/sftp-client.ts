
import path from "path";
import SSH from "node-ssh";
import { BaseClient } from "./base-client";
import { log } from "@/utils";
import { SFtpOptions } from "@/interface";

export class SftpClient extends BaseClient {
  public ssh: SSH;
  constructor(options: SFtpOptions) {
    super(options)
    this.ssh = new SSH();
    this.start();
  }
  async uploadFiles(): Promise<void> {
    const { remotePath, sourcePath } = this.options;
    let failed: string[] = [];
    try {
      await this.ssh.putDirectory(sourcePath, remotePath, {
        recursive: true,
        concurrency: 20,
        validate() {
          return true
        },
        tick: (localPath, remotePath, err) => {
          if (err) return failed.push(localPath);
          this.emit("progress", path.basename(localPath))
        }
      }).then(() => {
        if (failed.length) {
          log.error(`[sftp uploadFiles failed transfers] ${failed.join(", ")}`)
        }
      })

    } catch (_) {
      log.error(`[sftp upload]${_}`)
    }
  }
  connect(opts: SFtpOptions): Promise<boolean> {
    return new Promise(async (result, reject) => {
      try {
        await this.ssh.connect(opts)
        result(true)
      } catch (_) {
        reject(_)
      }
    })
  }
}