# Música Vinilo

Experiencia web responsive con portada, vinilo giratorio, fondo líquido y reproductor de video de YouTube. Los archivos se mantienen separados por función.

## Estructura
- `index.html`: estructura de la página.
- `css/styles.css`: diseño y animaciones.
- `js/app.js`: lógica del reproductor y lectura de Google Sheets.
- `img/canciones/`: portadas de canciones.
- `datos/Musica.csv`: ejemplo de columnas para el catálogo.

## Conectar la hoja de Google
La aplicación usa la hoja que compartiste, con ID `1eMXgoVm_JjMmzh6xPGFYDVmIyujttinF3bCrQWg29c0`, e intenta leer la primera pestaña (gid=0) en formato CSV.

1. En Google Sheets, comprueba que la primera fila tenga exactamente estas columnas: `id, titulo, artista, portada, youtube_url, activa, orden`.
2. En **Compartir**, permite que cualquier persona con el enlace pueda ver los datos, o usa **Archivo → Compartir → Publicar en la web** y publica la pestaña correcta como CSV. Si la pestaña tiene otro gid, actualiza `SHEET_CSV_URL` en `js/app.js`.
3. No incluyas información privada: la hoja publicada o accesible por cualquiera se considera pública.
4. En `portada`, usa rutas del repositorio, por ejemplo `img/canciones/mi-cancion.jpg`, o una URL pública de imagen. Sube la imagen a `img/canciones/` y escribe el mismo nombre/ruta en la hoja.
5. En `youtube_url`, pega el enlace de YouTube. En `activa`, usa `SI` o `NO`. `orden` determina el orden en que aparecen las canciones.

La página actualiza el catálogo cada 60 segundos. Cuando una portada cambia en la hoja, la funda, la etiqueta central del vinilo y el fondo asociado se actualizan al volver a sincronizar.

## Límites
- La reproducción usa el reproductor incrustado oficial de YouTube; algunos videos pueden impedir la reproducción incrustada, mostrar anuncios o tener restricciones por región/cuenta.
- El navegador puede bloquear reproducción automática hasta que la persona toque el botón.
- Esta configuración de CSV requiere que la hoja permita lectura desde la web. Si no carga, revisa permisos, pestaña y gid.
- La portada de demostración es un SVG de ejemplo; reemplázala por tus propias portadas.
