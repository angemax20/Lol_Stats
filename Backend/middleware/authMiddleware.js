const supabase = require('../config/supabase');

async function verifyUser(req, res, next) {

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'No token'
    });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  req.user = data.user;

  next();
}

module.exports = verifyUser;