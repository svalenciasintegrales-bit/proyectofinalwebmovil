// mensaje para mostrar cuando la api responde con error (400, 401, 404, 409, 500) o cuando no hay conexion.
// la api siempre manda { status: 'error', message: '...' } y Angular lo deja en err.error
export function mensajeError(err: any): string {
  if (err && err.error && err.error.message) return err.error.message;
  return 'No hay conexión con el servidor. Revisa que la API esté prendida e inténtalo de nuevo.';
}
