module.exports = {
  apps: [
    {
      name: 'outbox-staging',
      script: 'npm run start',
      env: {
        // TZ: "US/Central",
        NODE_ENV: 'staging',
      },
    },
    {
      name: 'outbox-prod',
      script: 'npm run start',
      env: {
        // TZ: "US/Central",
        NODE_ENV: 'prod',
      },
    },
  ],
};
