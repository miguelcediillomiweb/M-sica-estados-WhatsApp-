# Música Vinilo

Experiencia web responsive con portada, vinilo giratorio, fondo líquido y reproductor de videos cortos alojados en el propio repositorio.

## Estructura
- `index.html`: estructura de la página.
- `css/styles.css`: diseño y animaciones.
- `js/app.js`: reproductor y lectura de Google Sheets.
- `img/canciones/`: portadas.
- `videos/`: archivos MP4 de las canciones/estados.
- `datos/Musica.csv`: plantilla de columnas.

## Columnas de Google Sheets
Usa esta fila de encabezados: `id, titulo, artista, portada, video, youtube_url, activa, orden`.

- `id`: identificador único.
- `titulo`: nombre de la canción o estado.
- `artista`: artista o descripción.
- `portada`: ruta de la imagen, por ejemplo `img/canciones/cancion-001.jpg`.
- `video`: ruta del archivo dentro del repositorio, por ejemplo `videos/cancion-001.mp4`. Esta es la opción recomendada.
- `youtube_url`: respaldo opcional si no se usa un archivo local. YouTube todavía puede imponer restricciones.
- `activa`: `SI` para mostrar y `NO` para ocultar.
- `orden`: número de posición.

## Añadir videos
1. Convierte o exporta el video a MP4 con video H.264 y audio AAC si tiene sonido.
2. En GitHub, abre la carpeta `videos/` y sube el archivo, por ejemplo `cancion-001.mp4`.
3. En la columna `video` de Google Sheets escribe exactamente `videos/cancion-001.mp4`.
4. En `portada` escribe la ruta de la imagen. La funda, el centro del vinilo y el fondo líquido comparten esa portada.
5. Deja `activa` en `SI`. La página sincroniza el catálogo cada 60 segundos.

**Tamaño recomendado:** mantén cada clip lo más comprimido posible, idealmente unos pocos MB. GitHub limita archivos individuales a 100 MB y GitHub Pages no es un servicio de streaming; para muchos videos o archivos grandes conviene usar almacenamiento de video/CDN aparte. No subas material que no tengas derecho a publicar.

## Conexión con Google Sheets
La aplicación intenta leer el CSV de la primera pestaña (gid=0) de la hoja configurada en `js/app.js`. Para que funcione, la pestaña debe poder leerse desde la web o publicarse como CSV. Si no se carga, comprueba el permiso, el gid y los encabezados. No coloques información privada en una hoja pública.

## Comportamiento
- Los videos de la columna `video` se reproducen directamente en un elemento HTML `video`, sin depender de YouTube.
- Si `video` está vacío y hay `youtube_url`, se usa YouTube como alternativa.
- Los navegadores pueden bloquear el autoplay; la experiencia se inicia al tocar el botón.
