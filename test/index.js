const path = require('path');
const deploy = require('../lib');

const dotenv = require('dotenv').config({ path: path.resolve(process.cwd(), '.env.ftp') });
let { USERNAME, PASSWORD, HOST, PORT, PROTOCOL, REMOTE_PATH } = dotenv.parsed;
deploy({
  username: USERNAME,
  password: PASSWORD,
  host: HOST,
  port: PORT,
  protocol: PROTOCOL,
  remotePath: REMOTE_PATH,
  sourcePath: path.join(process.cwd(), 'node_modules', '@babel'),
});
