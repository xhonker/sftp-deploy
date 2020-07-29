
import path from "path";
import SSH from "node-ssh";
import { BaseClient } from "./base-client";
import { log } from "@/utils";
import { SFtpOptions } from "@/interface";
import { Queue } from "@/internal/queue";
import { SFTPWrapper } from "ssh2";

export class SftpClient extends BaseClient {
  public ssh: SSH;
  public sftp: SFTPWrapper | undefined;
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
        this.sftp = await this.ssh.requestSFTP();
        result(true)
      } catch (_) {
        reject(_)
      }
    })
  }
  async putFiles(files: string[], { tick }: any): Promise<void> {
    const queue = new Queue({ concurrency: 20 });
    return new Promise((resolve, reject) => {
      files.forEach(file => {
        let [, remotePath] = this.getFilePath(file);
        queue.add(async () => {
          await this.ssh.putFile(file, remotePath, this.sftp)
          if (tick) tick(null, remotePath)
        }).catch(reject)
      })
      resolve(queue.waitTillIdle())
    })
  }
  async putDirectorys(dirs: string[]): Promise<void> {
    const queue = new Queue();
    return new Promise((resolve, reject) => {
      dirs.forEach(dir => {
        queue.add(async () => {
          let [, remotePath] = this.getFilePath(dir);
          await this.ssh.mkdir(remotePath, 'sftp', this.sftp)
        }).catch(reject)
      })
      resolve(queue.waitTillIdle())
    })
  }
}