# Assets Directory

Este directorio contiene los iconos para la aplicación.

## Iconos necesarios:

### Para la aplicación:
- `icon.png` - Icono principal de la aplicación (512x512px recomendado)

### Para el system tray:

**macOS:**
- `trayTemplate.png` - Icono de 16x16px o 22x22px en formato template (negro con transparencia)
- `trayTemplate@2x.png` - Versión retina 32x32px o 44x44px

**Windows/Linux:**
- `tray.png` - Icono de 16x16px o 32x32px

## Cómo crear los iconos:

Puedes crear iconos simples usando herramientas online o diseñarlos tú mismo.

Para macOS, el icono del tray debe ser:
- Blanco y negro (solo canal alpha)
- Fondo transparente
- 16x16px o 22x22px para versión normal
- 32x32px o 44x44px para versión @2x (retina)

Por ahora, la aplicación funcionará sin estos iconos usando un icono por defecto.
