import jwt from 'jsonwebtoken';

/**
 * Generates an access token.
 * @param {Object} user - The user object to include in the token payload.
 * @returns {string} The generated access token.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role }, // payload data
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' } // Access tokens typically have a shorter lifespan
  );
};

/**
 * Generates a refresh token.
 * @param {Object} user - The user object to include in the token payload.
 * @returns {string} The generated refresh token.
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role }, // payload data
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '7d' } // Refresh tokens have a longer lifespan
  );
};
