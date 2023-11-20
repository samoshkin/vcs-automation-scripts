import shelljs from 'shelljs';

function main() {
  const nodeVersion = shelljs.exec('node --version', { silent: true }).stdout;
  console.log(nodeVersion);
}

main();
