
// UPDATE
async function updateUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const nuevoNombre = document.getElementById('nombre').value;

  const { error } = await supabaseClient
    .from('users')
    .update({ nombre: nuevoNombre })
    .eq('id', user.id);

  if (error) {
    console.error("Error actualizando:", error);
    alert("No se pudo actualizar");
    return;
  }

  alert("Nombre actualizado");
  await loadUser();
}

// DELETE
function deleteUser() {
  openModal("¿Deseas eliminar tu cuenta?", async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    await supabaseClient
      .from('users')
      .delete()
      .eq('id', user.id);

    logout();
  });
}
loadUser();

let actionToConfirm = null;

function openModal(text, action) {
  document.getElementById('modal-text').innerText = text;
  document.getElementById('custom-confirm').style.display = 'flex';
  actionToConfirm = action;
}

function closeModal() {
  document.getElementById('custom-confirm').style.display = 'none';
}

function confirmAction() {
  if (actionToConfirm) actionToConfirm();
  closeModal();
}