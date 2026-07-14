import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'orysnap_jwt_secret_token_123456', {
    expiresIn: '30d',
  });
};

export default generateToken;
