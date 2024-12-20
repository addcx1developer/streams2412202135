import * as fsp from "node:fs/promises";

async function run() {
  console.time("readBig");
  const fileHandleRead = await fsp.open("../src.txt", "r");
  const fileHandleWrite = await fsp.open("dest.txt", "w");

  const streamRead = fileHandleRead.createReadStream({
    highWaterMark: 64 * 1024,
  });
  const streamWrite = fileHandleWrite.createWriteStream();

  let split = "";
  streamRead.on("data", (chunk) => {
    const numbers = chunk.toString("utf-8").split("  ");
    if (Number(numbers[0]) !== Number(numbers[1]) - 1 && split) {
      numbers[0] = split.trim() + numbers[0].trim();
    }

    if (
      Number(numbers[numbers.length - 2]) + 1 !==
      Number(numbers[numbers.length - 1])
    ) {
      split = numbers.pop();
    }

    for (const number of numbers) {
      let n = Number(number);
      if (n % 10 === 0 && !streamWrite.write(" " + n + " ")) {
        streamRead.pause();
      }
    }
  });

  streamWrite.on("drain", () => {
    streamRead.resume();
  });

  streamRead.on("end", () => {
    console.log("Done reading.");
    console.timeEnd("readBig");
  });
}

run();
