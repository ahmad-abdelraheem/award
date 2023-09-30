const bcrypt = require('bcrypt');

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

async function comparePassword(inputPassword, hashedPassword) {
  const passwordsMatch = await bcrypt.compare(inputPassword, hashedPassword);
  return passwordsMatch;
}
module.exports = {
  crypt: hashPassword,
  check: comparePassword
};

