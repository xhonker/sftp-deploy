import path from "path";
import { FtpClient } from "@/commo/ftp-client";
import { EntryOptions } from "./interface";

const dotenv = require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

let { USERNAME, PASSWORD, HOST, PORT, PROTOCOL, REMOTE_PATH } = dotenv.parsed;

function main(options: EntryOptions) {
  let { protocol, username, debug, ...opt } = options;

  if (protocol === 'ftp') {
    new FtpClient({ ...opt, user: username })
  }
}

main({
  username: USERNAME,
  password: PASSWORD,
  host: HOST,
  port: PORT,
  protocol: PROTOCOL,
  remotePath: REMOTE_PATH,
  sourcePath: path.join(process.cwd(), 'node_modules', '@babel')
})