
// set up test database
(async () => {
  if (process.env.NODE_ENV === 'Sequelize') {
    await import('../tests/layers/sequelize/config/setup');
  }
})();