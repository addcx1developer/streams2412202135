import { Writable } from "node:stream";
import * as fs from "node:fs";

class FileWriteStream extends Writable {
  constructor({ highWaterMark, fileName }) {
    super({ highWaterMark });
    this.fileName = fileName;
    this.fd = null;
    this.chunks = [];
    this.chunksSize = 0;
    this.writesCount = 0;
  }

  // This will run after the constructor, and it will put off all calling the other
  // methods until we call the callback function
  _construct(callback) {
    fs.open(this.fileName, "w", (err, fd) => {
      if (err) {
        // so if we call the callback with an argument, it means that we have an error
        // and we should not proceed
        callback(err);
      } else {
        this.fd = fd;
        // no argument means it was successful
        callback();
      }
    });
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    this.chunksSize += chunk.length;
    if (this.chunksSize > this.writableHighWaterMark) {
      fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
        if (err) return callback(err);
        this.chunks = [];
        this.chunksSize = 0;
        ++this.writesCount;
        callback();
      });
    } else {
      // when we're done, we should call the callback function
      callback();
    }
  }

  _final(callback) {
    fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
      if (err) return callback(err);
      ++this.writesCount;
      this.chunks = [];
      callback();
    });
  }

  _destroy(error, callback) {
    console.log("Number of writes:", this.writesCount);
    if (this.fd) {
      fs.close(this.fd, (err) => {
        callback(err || error);
      });
    } else {
      callback(error);
    }
  }
}

async function run() {
  console.time("customWritable");
  const stream = new FileWriteStream({
    fileName: "../src.txt",
  });

  let i = 0;
  const NUMBER_OF_WRITES = 100000;
  const writeMany = () => {
    while (i < NUMBER_OF_WRITES) {
      const buff = Buffer.from(` ${i} `, "utf-8");
      // this is our last write
      if (i === NUMBER_OF_WRITES - 1) return stream.end(buff);
      // if stream.write returns false, stop the loop
      if (!stream.write(buff)) break;
      i++;
    }
  };

  writeMany();

  let numberOfDrains = 0;
  // resume our loop once our stream's internal buffer is emptied
  stream.on("drain", () => {
    ++numberOfDrains;
    writeMany();
  });

  stream.on("finish", () => {
    console.log("Number of drains:", numberOfDrains);
    console.timeEnd("customWritable");
  });
}

run();
