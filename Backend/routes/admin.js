const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');
const verifyUser = require('../middleware/authMiddleware');

router.delete('/delete-user/:id', verifyUser, async (req, res) => {

  const userId = req.params.id;

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    return res.status(500).json(error);
  }

  res.json({
    success: true
  });
});

module.exports = router;

router.put('/change-role', verifyUser, async (req, res) => {

  const { userId, newRole } = req.body;

  // buscar usuario actual
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  // verificar admin
  if (
    currentUser.rol !== 'admin' &&
    currentUser.rol !== 'master'
  ) {
    return res.status(403).json({
      error: 'No autorizado'
    });
  }

  // cambiar rol
  const { error } = await supabase
    .from('users')
    .update({
      rol: newRole
    })
    .eq('id', userId);

  if (error) {
    return res.status(500).json(error);
  }

  res.json({
    success: true
  });
});