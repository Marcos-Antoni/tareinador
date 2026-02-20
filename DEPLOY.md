# 🚀 Deploy en VPS Ubuntu

## Requisitos
- Ubuntu 20.04+ con Docker y Docker Compose instalados
- Puerto 80 abierto

## Pasos

### 1. Clonar el repo
```bash
git clone https://github.com/Marcos-Antoni/tareinador.git
cd tareinador
```

### 2. Crear archivo .env
```bash
cp .env.example .env
nano .env
```

Configurar:
```env
GEMINI_API_KEY=tu_api_key_real
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGIN=http://tu-dominio-o-ip
PORT=80
```

### 3. Levantar en producción
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verificar
```bash
# Ver que los contenedores estén corriendo
docker ps

# Ver logs
docker logs tareinador-web
docker logs tareinador-api
```

Abrir `http://tu-ip-del-vps` en el navegador.

## Comandos útiles

```bash
# Detener
docker compose -f docker-compose.prod.yml down

# Reiniciar
docker compose -f docker-compose.prod.yml restart

# Rebuild después de un git pull
docker compose -f docker-compose.prod.yml up -d --build

# Ver logs en vivo
docker logs -f tareinador-api
```

## Estructura de producción

| Servicio | Imagen | Puerto | Función |
|---|---|---|---|
| `frontend` | Nginx Alpine | 80 (público) | Sirve React + proxy API |
| `backend` | Python + Gunicorn | 5006 (interno) | API REST + PDF |

El frontend Nginx hace reverse proxy: las rutas `/api/*` y `/uploads/*` van al backend automáticamente.

## Con dominio (opcional)

Si tienes un dominio, agrega un proxy inverso (Nginx/Caddy) delante o cambia `PORT=443` y configura SSL.
