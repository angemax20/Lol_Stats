async function loadAllUsers() {
  const { data: users, error } = await supabaseClient
    .from('users')
    .select('*');

  if (error) {
    console.error("Error cargando usuarios:", error);
    return;
  }

  const tbody = document.getElementById('users-body');
  tbody.innerHTML = "";

  if (!users || users.length === 0) {
  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center; color: #aaa;">
        No se encontraron usuarios
      </td>
    </tr>
  `;
  return;
}

  users.forEach(user => {

    // ocultar master
    if (user.rol === 'master') return;

    const row = `
      <tr>
        <td>${user.nombre}</td>
        <td>${user.correo}</td>
        <td>
          <select onchange="changeRole('${user.id}', this.value)">
            <option value="user" ${user.rol === 'user' ? 'selected' : ''}>User</option>
            <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td>
          <button onclick="deleteUserByAdmin('${user.id}')">Eliminar</button>
        </td>
      </tr>
    `;

    tbody.innerHTML += row;
  });
}

async function changeRole(userId, newRole) {

  const { data } = await supabaseClient.auth.getSession();

  const token = data.session.access_token;

  const res = await fetch(
    `https://lolstats-production-a058.up.railway.app/api/admin/change-role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        newRole
      })
    }
  );

  const result = await res.json();

  if (!res.ok) {
    alert(result.error || "Error");
    return;
  }

  loadAllUsers();
}

async function deleteUserByAdmin(userId) {

  openModal("¿Deseas eliminar a este usuario?", async () => {

    const { data } = await supabaseClient.auth.getSession();

    const token = data.session.access_token;

    const res = await fetch(
      `https://lolstats-production-a058.up.railway.app/api/admin/delete-user/${userId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error(result);
      alert("Error eliminando usuario");
      return;
    }

    showToast('Usuario eliminado correctamente.');

    loadAllUsers();
  });
}