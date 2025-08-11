const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Read token from cookie

  if (!token) {
    return res
      .status(401)
      .send(`
        <script>
          alert("Please login first!");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        </script>
      `);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Standardize: always make req.user the actual user object
    req.user = decoded.user || decoded;

    next();
  } catch (err) {
    return res
      .status(401)
      .send(`
        <script>
          alert("Session expired or invalid token!");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        </script>
      `);
  }
};

module.exports = verifyToken;
