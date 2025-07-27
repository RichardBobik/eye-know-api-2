const requireAuth = (redisClient) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    console.log("inside auth: " + authorization);
    if (!authorization) {
      return res.status(401).json("Unauthorized");
    }

    try {
      const reply = await redisClient.get(authorization);
      if (!reply) {
        return res.status(401).json("Unauthorized");
      }
      next();
    } catch (err) {
      console.error("Redis error:", err);
      return res.status(500).json("Server error");
    }
  };
};

module.exports = {
  requireAuth,
};
