import * as fs from "node:fs";
import * as fsp from "node:fs/promises";

async function asyncFn() {
  console.time("writeMany");
  const fileHandle = await fsp.open("../src.txt", "w");

  for (let i = 0; i < 1000000; i++) {
    await fileHandle.write(` ${i} `);
  }
  console.timeEnd("writeMany");
}

function callbackFn() {
  console.time("writeMany");
  fs.open("../src.txt", "w", (err, fd) => {
    for (let i = 0; i < 1000000; i++) {
      const buff = Buffer.from(` ${i} `, "utf-8");
      fs.writeSync(fd, buff);
    }

    console.timeEnd("writeMany");
  });
}

async function firstStreamFn() {
  console.time("writeMany");

  const fileHandle = await fsp.open("../src.txt", "w");
  const stream = fileHandle.createWriteStream();

  for (let i = 0; i < 1000000; i++) {
    const buff = Buffer.from(` ${i} `, "utf-8");

    // console.log(stream.writableBuffer);
    // console.log(stream.writableHighWaterMark);
    stream.write(buff);
  }

  console.timeEnd("writeMany");
}

async function run() {
  console.time("writeMany");

  const fileHandle = await fsp.open("../src.txt", "w");
  const stream = fileHandle.createWriteStream();
  console.log(stream.writableHighWaterMark);

  // 8 bits = 1 byte
  // 1000 bytes = 1 kilobyte
  // 1000 kilobytes = 1 megabyte

  // 1a => 0001 1010

  // const buff = Buffer.alloc(65535, "a");
  // console.log(stream.write(buff));
  // console.log(stream.write(Buffer.alloc(1, "a")));
  // console.log(stream.write(Buffer.alloc(1, "a")));
  // console.log(stream.write(Buffer.alloc(1, "a")));

  // console.log(stream.writableLength);

  // stream.on("drain", () => {
  //   console.log(stream.write(Buffer.alloc(65536, "a")));
  //   console.log(stream.writableLength);

  //   console.log("We are now safe to write more!");
  // });

  let i = 0;
  const MAX_LENGTH = 100000;
  const writeMany = () => {
    while (i < MAX_LENGTH) {
      const buff = Buffer.from(` ${i} `, "utf-8");
      // this is our last write
      if (i === MAX_LENGTH - 1) return stream.end(buff);
      // if stream.write returns false, stop the loop
      if (!stream.write(buff)) break;
      i++;
    }
  };

  writeMany();

  // resume our loop once our stream's internal buffer is emptied
  stream.on("drain", () => {
    // console.log("Drained!!!");
    writeMany();
  });

  stream.on("finish", () => {
    console.timeEnd("writeMany");
    fileHandle.close();
  });

  // stream.on("close", () => { });
}

run();
