### simple SFTP/FTP sync deploy

### Install

```shell
npm i sftp-deploy -D
yarn add sftp-deploy -D
```

### Usage

```js
const deploy = require('sftp-deploy');
deploy({
  username: 'user',
  password: 'pwd',
  host: '127.0.0.1',
  port: 21,
  protocol: 'ftp',
  remotePath: '/tmp',
  localPath: process.cwd(),
});
```

### EntryOptions

| Key        | Type           | Default       | Description        |
| ---------- | -------------- | ------------- | ------------------ |
| username   | string         |               | username           |
| password   | string         |               | pwd                |
| host       | string         | '127.0.0.1'   | remote host        |
| port       | number         | 21            | remote port        |
| protocol   | "ftp"\| "sftp" | "ftp"         | protocol           |
| remotePath | string         | os.tmpdir()   | remote upload path |
| localPath  | string         | process.cwd() | local path         |
