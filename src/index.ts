import path from "path";
import { FtpClient } from "@/commo/ftp-client";
import { SftpClient } from "@/commo/sftp-client";
import { EntryOptions } from "./interface";

const dotenv = require('dotenv').config({ path: path.resolve(process.cwd(), '.env.ftp') });
let { USERNAME, PASSWORD, HOST, PORT, PROTOCOL, REMOTE_PATH } = dotenv.parsed;

function main(options: EntryOptions) {
  let { protocol, username, debug, ...opt } = options;

  if (protocol === 'ftp') {
    new FtpClient({ ...opt, user: username })
  } else {
    new SftpClient({
      ...opt,
      username
    })
  }
}

main({
  username: USERNAME,
  password: PASSWORD,
  host: HOST,
  port: PORT,
  protocol: PROTOCOL,
  remotePath: REMOTE_PATH,
  sourcePath: path.join(process.cwd(), "node_modules", '@babel')
})