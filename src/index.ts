import { assert } from "@/utils";
import { FtpClient } from "@/common/ftp-client";
import { SftpClient } from "@/common/sftp-client";
import { EntryOptions } from "./interface";


export default (options: EntryOptions) => {
  assert(typeof options === 'object', "entry options must be a object")
  options = Object.assign({
    host: "",
    port: 0,
    username: "",
    password: "",
    protocol: 'ftp',
    remotePath: "/tmp",
    localPath: process.cwd()
  }, options)
  let { protocol, username, ...opts } = options;
  if (protocol === 'ftp') {
    new FtpClient({ ...opts, user: username })
  } else {
    new SftpClient({ ...opts, username })
  }
}