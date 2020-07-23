export interface EntryOptions {
  username: string;
  password: string;
  host: string;
  port: number;
  protocol: 'ftp' | 'sftp';
  remotePath: string;
  sourcePath: string;
  debug?: boolean;
}

export interface FtpOptions extends BaseOptions {
  user: string;
}
interface BaseOptions {
  host: string;
  port: number;
  password: string;
  remotePath: string;
  sourcePath: string;
}

export interface SFtpOptions extends BaseOptions {
  username: string;
}