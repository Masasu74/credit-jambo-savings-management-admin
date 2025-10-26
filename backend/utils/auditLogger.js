
// utils/auditLogger.js
import fs from 'fs';
import path from 'path';

const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logFile = path.join(logDir, 'audit.log');

const auditLogger = {
  logError: (err, req) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.path} - ${err.message}\n`;
    fs.appendFileSync(logFile, log);
    console.error(log);
  }
};

export default auditLogger;
