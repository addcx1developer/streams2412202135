import { Transform } from "node:stream";
import * as fs from "node:fs/promises";

class Decrypt extends Transform {
  _transform(chunk, encoding, callback) {
    for (let i = 0; i < chunk.length; ++i) {
      if (chunk[i] !== 255) {
        chunk[i] = chunk[i] - 1;
      }
    }
    // this.push(chunk);
    callback(null, chunk);
  }
}

async function run() {
  const readFileHandle = await fs.open("dest.txt", "r");
  const writeFileHandle = await fs.open("decrypted.txt", "w");

  const readStream = readFileHandle.createReadStream();
  const writeStream = writeFileHandle.createWriteStream();

  const decrypt = new Decrypt();

  readStream.pipe(decrypt).pipe(writeStream);
}

run();
