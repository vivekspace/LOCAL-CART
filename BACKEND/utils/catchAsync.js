module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catches errors and passes them to global error handling middleware
  };
};