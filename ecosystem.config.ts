module.exports = {
  apps: [
    {
      name: 'Ilap_backend',
      script: './index.ts', // direct script
      interpreter: 'ts-node',   // explicitly use ts-node
      watch: false,
      time: false,
      error_file: './pm2logs/err.log',
      out_file: './pm2logs/out.log',
    },
  ],
};