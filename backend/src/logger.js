export default {
  log: (message, err) => {
    console.error(`${new Date().toISOString()} - ${message}`, err);
  },
};
