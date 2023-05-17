module.exports = {
  resolve: {
    fallback: {
      stream: require.resolve('stream-browserify'),
    },
  },
  /* resolve: {
    alias: {
      stream: 'stream-browserify',
    },
  }, */
  
};
