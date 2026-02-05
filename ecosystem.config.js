module.exports = {
  apps: [
    {
      name: 'nalsuvai-backend',
      script: './node_modules/.bin/ts-node',
      args: './index.ts',
      interpreter: 'node',
      watch: false,
      error_file: './pm2logs/err.log',
      out_file: './pm2logs/out.log',
      log_file: './pm2logs/combined.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
