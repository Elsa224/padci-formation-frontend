// pm2: pm2 start ecosystem.config.cjs  (depuis server/, .env chargé par dotenv)
module.exports = {
  apps: [
    {
      name: 'emsp_mailer',
      script: 'index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '200M',
      env: { NODE_ENV: 'production' },
    },
  ],
}
