// LOGIN
async function login() {
  await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://127.0.0.1:5500/dashboard.html',

      queryParams: {
        prompt: 'select_account'
      }
    }
  });
}

async function loginWith(provider) {
  await supabaseClient.auth.signInWithOAuth({
  provider: provider,
  options: {
    redirectTo: 'http://127.0.0.1:5500/dashboard.html',

    queryParams: {
      prompt: 'select_account'
    }
  }
});
}

// LOGOUT
async function logout() {
  await supabaseClient.auth.signOut();
  location.reload();
}

// MOSTRAR USUARIO
async function loadUser() {
  console.log("loadUser ejecutado");

  const { data: { user } } = await supabaseClient.auth.getUser();

  console.log("USER:", user);

  const loginSection = document.getElementById('login-section');
  const adminSection = document.getElementById('admin-section');

  const path = window.location.pathname;

  const isIndex = path === "/" || path.includes("index.html");
  const isDashboard = path.includes("dashboard.html");


  // NO logeado intentando entrar al dashboard
  if (!user && isDashboard) {
    window.location.href = "index.html";
    return;
  }

  // Logeado intentando entrar al login
  if (user && isIndex) {
    window.location.href = "dashboard.html";
    return;
  }

  // NO logeado
  if (!user) {
   if (loginSection) loginSection.style.display = 'block';
   if (adminSection) adminSection.style.display = 'none';
   return;
  }

  // logeado
  if (loginSection) loginSection.style.display = 'none';

  // Buscar usuario en la tabla
  let { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Si NO existe → crearlo
  if (!data) {
    const { error: insertError } = await supabaseClient
      .from('users')
      .insert([
        {
          id: user.id,
          nombre: user.user_metadata.full_name,
          correo: user.email,
          rol: 'user'
        }
      ]);

    if (insertError) {
      console.error("Error creando usuario:", insertError);
      return;
    }

    // volver a cargar después de crear
    return loadUser();
  }

  // Mostrar datos
  const userInfo = document.getElementById('user-info');

  if (userInfo) {
  userInfo.innerHTML = `
    <strong>Nombre:</strong> ${data.nombre} <br>
    <strong>Email:</strong> ${data.correo} <br>
    <strong>Rol:</strong> ${data.rol}
  `;
  }

  if (data.rol === 'admin' || data.rol === 'master') {

  if (adminSection) {
    adminSection.style.display = 'block';
  }

  if (typeof loadAllUsers === 'function') {
    loadAllUsers();
  }
}
else {

  if (adminSection) {
    adminSection.style.display = 'none';
  }

}
}