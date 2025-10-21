export const metadata = {
  title: 'Buscador de Imágenes sin Sesgos',
  description: 'Aplicación que consume la API de Pixabay con filtros contra sesgos raciales y de género',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}