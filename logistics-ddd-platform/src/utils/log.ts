// src/utils/log.ts
import chalk from 'chalk';

// Tag should be exactly 6 characters total (including brackets and padding)
function formatTag(tag: string): string {
  // All tags should be exactly 6 characters: [TAG] + padding
  return tag.padEnd(6);
}

function timestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function format(tag: string, color: (t: string) => string, msg: string): string {
  const coloredTag = color(formatTag(tag));
  return `${timestamp()}  ${coloredTag}  ${msg}`;
}

export const log = {
  ok: (msg: string) => console.log(format('[OK]', chalk.green, msg)),
  info: (msg: string) => console.log(format('[INFO]', chalk.cyan, msg)),
  warn: (msg: string) => console.warn(format('[WARN]', chalk.yellow, msg)),
  err: (msg: string) => console.error(format('[ERR]', chalk.red, msg)),
  load: (msg: string) => console.log(format('[...]', chalk.gray, msg)),
};
