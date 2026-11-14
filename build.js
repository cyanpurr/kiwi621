// If anyone wants to add support for Firefox or Opera or whatever else browsers there are then go for it.

const esbuild = require("esbuild");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const root = __dirname;
const gh = "https://raw.githubusercontent.com/cyanpurr/kiwi621/main/library";
const local = "http://127.0.0.1:8621/library";
const library = (process.env.LIBRARY || (process.argv.includes("--local") ? local : gh)).replace(/\/+$/, "");

function pack(stage, temp) {
  const chrome = process.env.CHROME_PATH || "chrome";
  const key = path.join(root, "extension.pem");
  const output = path.join(root, "extension.crx");
  const profile = path.join(temp, "profile");
  const crx = `${stage}.crx`;
  const pem = `${stage}.pem`;
  const args = [
    `--pack-extension=${stage}`, `--user-data-dir=${profile}`,
    "--headless=new", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check"
  ];

  if (fs.existsSync(key)) {
    args.push(`--pack-extension-key=${key}`);
  }

  fs.rmSync(output, { force: true });

  try {
    execFileSync(chrome, args, { stdio: "inherit", windowsHide: true });
  } catch (error) {
    throw new Error("could not run chrome");
  }

  fs.copyFileSync(crx, output);

  if (!fs.existsSync(key) && fs.existsSync(pem)) {
    fs.copyFileSync(pem, key);
  }

  return output;
}

async function build() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "kiwi621-"));
  const stage = path.join(temp, "extension");
  const options = {
    bundle: true, write: false, format: "iife", target: "es2020",
    define: { __LIBRARY__: JSON.stringify(library) },
    loader: { ".png": "dataurl" }
  };

  fs.mkdirSync(stage);

  try {
    const [content, background] = await Promise.all([
      esbuild.build({ ...options, entryPoints: [path.join(root, "src", "index.js")] }),
      esbuild.build({ ...options, entryPoints: [path.join(root, "src", "background.js")] })
    ]);

    fs.writeFileSync(path.join(stage, "content.js"), content.outputFiles[0].text);
    fs.writeFileSync(path.join(stage, "background.js"), background.outputFiles[0].text);
    fs.copyFileSync(path.join(root, "src", "extension", "manifest.json"), path.join(stage, "manifest.json"));
    fs.copyFileSync(path.join(root, "src", "extension", "icon.png"), path.join(stage, "icon.png"));

    const output = pack(stage, temp);
    console.log(`done!`);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

build().catch(error => {
  console.error(error.message);
  process.exit(1);
});
