import Link from "next/link";
export default function NotFound() {
  return (
    <main id="contenido" className="wrap section">
      <p className="eyebrow">404</p>
      <h1>Este espacio aún no existe.</h1>
      <Link href="/" className="button button-dark">
        Volver al inicio
      </Link>
    </main>
  );
}
