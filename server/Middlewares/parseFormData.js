// Middleware to parse stringified JSON in form-data
export const parseFormData = (req, res, next) => {
  // Parse sizes if it's a string
  if (req.body.sizes && typeof req.body.sizes === 'string') {
    try {
      req.body.sizes = JSON.parse(req.body.sizes);
    } catch (error) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid sizes format - must be valid JSON array",
        data: [],
      });
    }
  }

  // Parse season if it's a string
  if (req.body.season && typeof req.body.season === 'string') {
    try {
      req.body.season = JSON.parse(req.body.season);
    } catch (error) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid season format - must be valid JSON array",
        data: [],
      });
    }
  }

  // Parse tags if it's a string
  if (req.body.tags && typeof req.body.tags === 'string') {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch (error) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid tags format - must be valid JSON array",
        data: [],
      });
    }
  }

  // Convert featured to boolean
  if (req.body.featured !== undefined) {
    req.body.featured = req.body.featured === 'true' || req.body.featured === true;
  }

  next();
};