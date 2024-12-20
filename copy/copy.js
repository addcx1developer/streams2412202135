import * as fsp from "node:fs/promises";
import { pipeline } from "node:stream";

async function readCopy() {
  console.time("copy");
  const destFile = await fsp.open("text-copy.txt", "w");
  const srcFile = await fsp.readFile("../src.txt");
  await destFile.write(srcFile);
  console.timeEnd("copy");
}

async function bufferCopy() {
  console.time("copy");
  const srcFile = await fsp.open("../src.txt", "r");
  const destFile = await fsp.open("text-copy.txt", "w");

  let bytesRead = -1;
  while (bytesRead !== 0) {
    const readResult = await srcFile.read();

    bytesRead = readResult.bytesRead;
    if (bytesRead !== 16384) {
      const indexOfNotFilled = readResult.buffer.indexOf(0);
      const newBuffer = Buffer.alloc(indexOfNotFilled);
      readResult.buffer.copy(newBuffer, 0, 0, indexOfNotFilled);
      destFile.write(newBuffer);
    } else {
      destFile.write(readResult.buffer);
    }
  }
  console.timeEnd("copy");
}

async function run() {
  console.time("copy");
  const srcFile = await fsp.open("../src.txt", "r");
  const destFile = await fsp.open("text-copy.txt", "w");
  const readStream = srcFile.createReadStream();
  const writeStream = destFile.createWriteStream();

  // console.log(readStream.readableFlowing);
  // readStream.pipe(writeStream);
  // console.log(readStream.readableFlowing);
  // readStream.unpipe(writeStream);
  // console.log(readStream.readableFlowing);
  // readStream.pipe(writeStream);
  // console.log(readStream.readableFlowing);
  // readStream.on("end", () => console.timeEnd("copy"));

  pipeline(readStream, writeStream, (err) => {
    console.log(err);
    console.timeEnd("copy");
  });
}

run();
