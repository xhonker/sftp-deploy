const path = require('path');
const deploy = require('../_local');

const dotenv = require('dotenv').config({ path: path.resolve(process.cwd(), '.env.ftp') });
let { USERNAME, PASSWORD, HOST, PORT, PROTOCOL, REMOTE_PATH } = dotenv.parsed;
deploy
  .start({
    username: USERNAME,
    password: PASSWORD,
    host: HOST,
    port: PORT,
    protocol: PROTOCOL,
    remotePath: REMOTE_PATH,
    sourcePath: path.join(process.cwd(), 'node_modules', '@types'),
    passive: false,
  })
  .then(() => console.log('Success'))
  .catch(() => console.log('fail'));
