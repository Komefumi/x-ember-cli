import { promisify } from "util";
import { join as joinPath, dirname as getDirname } from "path";
import {
  readFile as readFileAsync,
  readdir as readDirAsync,
  exists as fileExistsAsync,
  writeFile as writeFileAsync,
} from "fs";
import { exec } from "child_process";
import prettier from "prettier";
// import { findUp } from "find-up";

interface IFilePathToContent {
  [path: string]: string;
}

const sh = promisify(exec);
const readFile = promisify(readFileAsync);
const writeFile = promisify(writeFileAsync);
const readDir = promisify(readDirAsync);

console.log(process.argv);
console.log(process.cwd());
const callingDir = process.cwd();

const possiblePrettierFiles: string[] = [
  ".prettierrc",
  ...["json", "yml", "yaml", "json5", "js", "cjs"].map(
    (ext) => `.prettierrc.${ext}`
  ),
  ...["js", "cjs"].map((ext) => `pretter.config.${ext}`),
  ".prettierrc.toml",
];

async function getPathForNeededFilesIfInDir(
  dirToLookInside: string,
  neededFiles: string[]
): Promise<string[]> {
  try {
    const dirContents = await readDir(dirToLookInside);
    return dirContents
      .filter((itxFilename) => neededFiles.includes(itxFilename))
      .map((itxFilename) => joinPath(dirToLookInside, itxFilename));
  } catch (error) {
    console.error(error);
    throw new Error("Error encountered during operation");
  }
}

async function findUpwards(
  startDir: string,
  fileSelect: string | string[]
): Promise<string[] | null> {
  try {
    let filePaths: string[] = [];
    if (fileSelect instanceof Array) {
      filePaths = await getPathForNeededFilesIfInDir(startDir, fileSelect);
    } else {
      const dirContents = await readDir(startDir);
      if (dirContents.includes(fileSelect)) {
        filePaths = [joinPath(startDir, fileSelect)];
      }
    }
    if (filePaths.length === 0) {
      return findUpwards(getDirname(startDir), fileSelect);
    } else return filePaths;
  } catch (error) {
    return null;
  }
}

async function main() {
  try {
    const { stdout, stderr } = await sh(
      `ember ${process.argv.slice(2).join(" ")}`
    );

    if (stderr.length !== 0) {
      console.log(
        "NOTE: X-Ember-CLI has encountered an error in underlying ember-cli and will now exit..."
      );
      console.log("Error from ember-cli:\n-----------------------------\n\n\n");
      console.error(stderr);
      return process.exit(1);
    }

    const dotEmberCLIPath = await findUpwards(callingDir, ".ember-cli").then(
      (pathList) => pathList && pathList[0]
    );
    if (!dotEmberCLIPath) {
      throw new Error(
        "ERROR! This tool can only be used within an Ember project"
      );
    }
    let prettierOptions: any | null = null;
    const emberProjectDir = getDirname(dotEmberCLIPath);
    const projectPackageJSON = require(joinPath(
      emberProjectDir,
      "package.json"
    ));
    if (!projectPackageJSON.prettier) {
      const prettierConfigFileName = await getPathForNeededFilesIfInDir(
        emberProjectDir,
        possiblePrettierFiles
      ).then((fileList) => fileList[0]);
      const prettierConfigPath = prettierConfigFileName
        ? joinPath(emberProjectDir, prettierConfigFileName)
        : null;
      if (prettierConfigPath) {
        prettierOptions = await prettier.resolveConfig(prettierConfigPath);
      }
    } else {
      prettierOptions = projectPackageJSON.prettier;
    }

    console.log(stdout);
    console.error(stderr);

    const scriptFiles = stdout.match(/\S+\.(ts|js)$/g) || [];
    const scriptFilePathToContent: IFilePathToContent = {};

    for (let filePath of scriptFiles) {
      const fullPath = joinPath(callingDir, filePath);
      const stringContent = (await readFile(fullPath)).toLocaleString();
      scriptFilePathToContent[fullPath] = stringContent;
    }

    if (stderr.length === 0) {
      let option: string | undefined = process.argv[2];
      option = option ? option.toLowerCase() : undefined;
      if (option === "route") {
        // TODO: replace extend with class form
      }
    }

    if (prettierOptions) {
      for (let fullPath of Object.keys(scriptFilePathToContent)) {
        await writeFile(
          fullPath,
          prettier.format(scriptFilePathToContent[fullPath], prettierOptions)
        );
      }
    }
  } catch (error) {
    console.log("ERROR: An error was encountered:\n\n");
    console.error(error);
    return process.exit(1);
  }
}

main();
