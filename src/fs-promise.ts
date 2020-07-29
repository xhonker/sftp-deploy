import fs from "fs-extra";

export const stat = (path: string): Promise<fs.Stats> => new Promise((resolve, reject) => {
  fs.stat(path, (err, stats) => {
    if (err) return reject(err);
    resolve(stats || null)
  })
})
export const readdir = (path: string): Promise<string[]> => new Promise((resolve, reject) => {
  fs.readdir(path, (err, files) => {
    if (err) return reject(err);
    resolve(files || null)
  })
})