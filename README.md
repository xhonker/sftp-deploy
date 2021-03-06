### simple SFTP/FTP sync deploy

### Install

```shell
npm i @xhonker/deploy -D
OR
yarn add @xhonker/deploy -D
```

### Usage

```js
const deploy = require('@xhonker/deploy');
deploy
  .start({
    username: 'user',
    password: 'pwd',
    host: '127.0.0.1',
    port: 21,
    protocol: 'ftp',
    remotePath: '/tmp',
    sourcePath: process.cwd(),
    passive: false, // active mode
  })
  .then(() => console.log('complete'))
  .cache((_) => console.error('fail'));
```

### EntryOptions

| Key        | Type           | Default       | Description        |
| ---------- | -------------- | ------------- | ------------------ |
| username   | string         | -             | username           |
| password   | string         | -             | pwd                |
| host       | string         | 127.0.0.1     | remote host        |
| port       | number         | 21            | remote port        |
| protocol   | "ftp"\| "sftp" | ftp           | protocol           |
| remotePath | string         | os.tmpdir()   | remote upload path |
| sourcePath | string         | process.cwd() | source path        |
| passive    | boolean        | true          | ftp passive mode   |
