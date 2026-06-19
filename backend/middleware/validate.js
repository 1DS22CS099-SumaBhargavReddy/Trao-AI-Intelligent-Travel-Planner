module.exports = function (schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const issues = error.issues || error.errors || [];
        const errorMessages = issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({ 
          message: 'Input validation failed', 
          errors: errorMessages 
        });
      }
      res.status(500).json({ message: 'Internal validation runner error' });
    }
  };
};
