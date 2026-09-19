module.exports = {
  apps: [
    {
      name: "telegram-self-tabchi-v6",
      script: "dist/server.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        TZ: "Asia/Tehran",
      },
      error_file: "./data/logs/pm2-error.log",
      out_file: "./data/logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
