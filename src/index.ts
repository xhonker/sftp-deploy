import os from 'os'
import { assert } from "@/utils";
import { FtpClient } from "@/core/ftp-client";
import { SftpClient } from "@/core/sftp-client";
import { EntryOptions } from "./interface";


export const start = (options: EntryOptions) => {
  assert(typeof options === 'object', "entry options must be a object")
  return new Promise((resolve, reject) => {
    options = Object.assign({
      host: "127.0.0.1",
      port: 21,
      username: "",
      password: "",
      protocol: 'ftp',
      remotePath: os.tmpdir(),
      sourcePath: process.cwd()
    }, options)
    let { protocol, ...opts } = options;
    let client = protocol === 'ftp' ? new FtpClient(opts) : new SftpClient(opts)
    client.on("error", reject)
    client.on("complete", resolve)
  })
}