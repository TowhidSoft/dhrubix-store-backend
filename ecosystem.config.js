module.exports = {
  apps: [
    {
      name: "denis_nunez",
      script: "./dist/server.js",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
