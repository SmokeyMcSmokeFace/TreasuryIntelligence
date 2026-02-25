// PM2 process manager config
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "treasury-platform",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/treasury",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/log/pm2/treasury-error.log",
      out_file: "/var/log/pm2/treasury-out.log",
    },
  ],
};
