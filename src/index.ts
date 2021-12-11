import { promisify } from "util";
import { exec } from "child_process";

const sh = promisify(exec);

console.log(process.argv);
console.log(process.cwd());

async function main() {
  try {
    const { stdout, stderr } = await sh(
      `ember ${process.argv.slice(2).join(" ")}`
    );
    console.log(stdout);
    console.error(stderr);
  } catch (error) {
    console.error(error);
    throw new Error("ERROR: An error was encountered");
  }
}

main();
