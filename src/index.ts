import { promisify } from "util";
import { join as joinPath, dirname as getDirname } from "path";
import { readFile as readFileAsync, writeFile as writeFileAsync } from "fs";
import { exec } from "child_process";
import prettier from "prettier";
import {
  getPathForNeededFilesIfInDir,
  findUpwards,
  toPascalCase,
  getJustLastDirNameOfPath,
} from "./utils";
import { prettierFallbackOptions } from "./config";
import { possiblePrettierFiles } from "./data";

interface IFilePathToContent {
  [path: string]: string;
}

const sh = promisify(exec);
const readFile = promisify(readFileAsync);
const writeFile = promisify(writeFileAsync);

export default async function main() {
  const callingDir = process.cwd();
  const { stdout, stderr } = await sh(
    `ember ${process.argv.slice(2).join(" ")}`
  );

  if (stderr.length !== 0) {
    throw new Error(`
      NOTE: X-Ember-CLI has encountered an error in underlying ember-cli and will now exit...
      Error from ember-cli:\n-----------------------------\n\n\n
      ${stderr}
    `);
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
  const projectPackageJSON = require(joinPath(emberProjectDir, "package.json"));
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

  const scriptFiles = stdout.match(/\S+\.(ts|js)/g) || [];
  const scriptFilePathToContent: IFilePathToContent = {};
  const routeFilePaths: string[] = [];

  for (let filePath of scriptFiles) {
    const fullPath = joinPath(emberProjectDir, filePath);
    const stringContent = (await readFile(fullPath)).toLocaleString();
    scriptFilePathToContent[fullPath] = stringContent;
    if (/.*\/route.(js|ts)$/gi.test(fullPath)) routeFilePaths.push(fullPath);
  }

  for (let filePath of routeFilePaths) {
    const hyphenName = getJustLastDirNameOfPath(filePath);
    const routeClassName = toPascalCase(hyphenName);
    const routeFileContents = scriptFilePathToContent[filePath] as string;
    const indexOfExportStart = (routeFileContents.match(/export/) as any).index;
    scriptFilePathToContent[filePath] =
      routeFileContents.slice(0, indexOfExportStart) +
      `export default class ${routeClassName} extends Route {}`;
    if (!prettierOptions)
      scriptFilePathToContent[filePath] = prettier.format(
        scriptFilePathToContent[filePath],
        prettierFallbackOptions
      );
  }

  if (prettierOptions) {
    for (let fullPath of Object.keys(scriptFilePathToContent)) {
      await writeFile(
        fullPath,
        prettier.format(scriptFilePathToContent[fullPath], {
          ...prettierFallbackOptions,
          ...prettierOptions,
        })
      );
    }
  }

  return `
    Execution successful\n
    Below is the output:\n\n\n
    ${stdout}
  `;
}
