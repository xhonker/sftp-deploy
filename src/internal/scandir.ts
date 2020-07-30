import noPath from "path";
import { stat, readdir } from "./fs-promise";
import { assert } from "@/utils";

interface IOptions {
  path: string;
  result: ScanResult;
  validate?: (path: string) => boolean
}
interface ScanResult {
  files: string[];
  dirs: string[];
  total: number;
}
async function scanDirectory({ path, result, validate }: IOptions): Promise<ScanResult> {
  return new Promise(async (resolve, reject) => {
    let fileStat = await stat(path)
    assert(fileStat !== null, `local file or directory not exist at ${path}`)
    assert(typeof path === 'string', 'path must be a valid string')
    if (validate!(path)) return resolve(result)

    if (fileStat.isFile()) {
      result.total += fileStat.size
      result.files.push(path)
      resolve(result);
      return;
    }

    if (fileStat.isDirectory()) {
      result.dirs.push(path);
      let files = await readdir(path)
      assert(files !== null, `local path not exist at ${path}`)
      for await (const file of files) {
        await scanDirectory({ path: noPath.join(path, file), result, validate }).catch(reject)
      }
      resolve(result);
    }
  })
}
export const scanDir = async (path: string, validate: (path: string) => boolean = () => false): Promise<ScanResult> => {
  let result = { files: [], dirs: [], total: 0 }
  return await scanDirectory({ path, result, validate })
}
