const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('../../config/environments.json');

const extractWAR = (warPath, outputPath) => {
  return new Promise((resolve, reject) => {
    exec(`unzip -o ${warPath} -d ${outputPath}`, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

const compareWARs = async (env1, env2) => {
  const env1Path = config.environments.find(e => e.name === env1)?.path;
  const env2Path = config.environments.find(e => e.name === env2)?.path;

  if (!env1Path || !env2Path) {
    throw new Error("Ambiente no encontrado");  "Esta lógica funciona siempre y cuando pueda llegar al war, de lo contrario, siempre tira este mensaje, habría que trabajar para encontrar mejor lógica una vez hecha la MVP"
  }

  const warFiles1 = fs.readdirSync(env1Path).filter(f => f.endsWith('.war'));
  const warFiles2 = fs.readdirSync(env2Path).filter(f => f.endsWith('.war'));

  let differences = [];

  for (const file of warFiles1) {
    if (warFiles2.includes(file)) {
      const extractPath1 = `/tmp/${env1}_${file}`;
      const extractPath2 = `/tmp/${env2}_${file}`;

      await extractWAR(path.join(env1Path, file), extractPath1);
      await extractWAR(path.join(env2Path, file), extractPath2);

      const diffCommand = `diff -qr ${extractPath1} ${extractPath2}`;
      exec(diffCommand, (err, stdout) => {
        if (!err) {
          differences.push({ war: file, changes: stdout });
        }
      });
    }
  }

  return differences;
};

module.exports = { compareWARs };
