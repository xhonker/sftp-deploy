import os from 'os'
import { assert } from "@/utils";
import { FtpClient } from "@/core/ftp-client";
import { SftpClient } from "@/core/sftp-client";
import { EntryOptions } from "./interface";


export const config = (options: EntryOptions) => {
  assert(typeof options === 'object', "entry options must be a object")
  options = Object.assign({
    host: "127.0.0.1",
    port: 0,
    username: "",
    password: "",
    protocol: 'ftp',
    remotePath: os.tmpdir(),
    localPath: process.cwd()
  }, options)
  let { protocol, username, ...opts } = options;
  if (protocol === 'ftp') {
    new FtpClient({ ...opts, user: username })
  } else {
    new SftpClient({ ...opts, username })
  }
}