# --- Imagen base: Python 3.12 slim (Debian Bookworm) ---
FROM python:3.12-slim

# Evitar prompts interactivos durante la instalación
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependencias del sistema que WeasyPrint necesita
# (Cairo, Pango, GDK-PixBuf, GLib, libffi, y fuentes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libglib2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependencias de Python primero (cache de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Crear directorio de salida para los PDFs
RUN mkdir -p /app/outputs

# Exponer el puerto de Flask
EXPOSE 5006

# Ejecutar la app
CMD ["python", "app.py"]
