module.exports = {
  apps: [
    {
      name: 'meowsms-admin',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/admin-bear',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: '/var/log/pm2/meowsms-admin-error.log',
      out_file: '/var/log/pm2/meowsms-admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
