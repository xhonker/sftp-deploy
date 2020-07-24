
import path from "path";
import { BaseClient } from "./base-client";
import { SFtpOptions } from "@/interface";
import SSH from "node-ssh";

export class SftpClient extends BaseClient {
  public ssh: SSH;
  constructor(options: SFtpOptions) {
    super(options)
    this.ssh = new SSH();
    this.start();
  }
  async uploadFiles(): Promise<void> {
    const { remotePath, sourcePath } = this.options;
    try {
      await this.ssh.putDirectory(sourcePath, remotePath, {
        recursive: true,
        concurrency: 20,
        validate() {
          return true
        },
        tick: (localPath, remotePath, err) => {
          if (!err) {
            this.emit("progress", path.basename(localPath))
          } else {
            // chalk red
            console.log(localPath)
          }
        }
      }).catch(e => console.log(e))

    } catch (_) {
      console.log("Quicker: SftpClient -> _", _)

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