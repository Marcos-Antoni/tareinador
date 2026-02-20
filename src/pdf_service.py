"""
Servicio de generación de PDF.
- Construye HTML completo con todas las secciones
- Convierte HTML a PDF usando WeasyPrint como librería
"""
import os
from datetime import datetime
from weasyprint import HTML
from .config import OUTPUT_DIR


def build_document_html(doc):
    """
    Construye el HTML completo del documento listo para PDF o preview.
    - doc: diccionario del documento con meta y pages
    Retorna: string HTML completo
    """
    sections_html = []

    # --- Carátula (siempre presente) ---
    if "caratula" in doc["sections"]:
        sections_html.append(_render_cover(doc))

    # --- Índice ---
    if "indice" in doc["sections"]:
        sections_html.append(_render_toc(doc))

    # --- Páginas de contenido ---
    for page in doc.get("pages", []):
        sections_html.append(_render_page(page))

    body = "\n".join(sections_html)

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: letter;
            margin: 2.5cm;
            @bottom-center {{
                content: "Página " counter(page);
                font-size: 10pt;
                color: #888;
            }}
        }}
        body {{
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            line-height: 1.8;
            color: #222;
            text-align: justify;
            font-size: 12pt;
        }}

        /* --- Carátula --- */
        .cover {{
            height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            border: 3px double #1a2332;
            padding: 60px 40px;
            page-break-after: always;
        }}
        .cover h1 {{
            font-size: 2.4em;
            color: #1a2332;
            margin-bottom: 10px;
            line-height: 1.3;
        }}
        .cover .meta {{
            margin-top: 60px;
            font-size: 1.15em;
            color: #444;
        }}
        .cover .meta p {{
            margin: 8px 0;
        }}
        .cover .university {{
            margin-top: 40px;
            font-size: 0.9em;
            color: #999;
            font-style: italic;
        }}

        /* --- Índice --- */
        .toc {{
            page-break-after: always;
        }}
        .toc h2 {{
            color: #1a2332;
            border-bottom: 2px solid #1a2332;
            padding-bottom: 8px;
            margin-bottom: 25px;
        }}
        .toc ul {{
            list-style: none;
            padding: 0;
        }}
        .toc li {{
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
            font-size: 1.05em;
        }}

        /* --- Contenido --- */
        .page-section {{
            page-break-before: always;
        }}
        .page-section:first-of-type {{
            page-break-before: auto;
        }}
        h1, h2, h3 {{
            color: #1a2332;
            page-break-after: avoid;
        }}
        h2 {{
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
            margin-top: 30px;
        }}
        p {{
            margin: 12px 0;
        }}

        /* --- Imágenes --- */
        .page-image {{
            text-align: center;
            margin: 20px 0;
        }}
        .page-image img {{
            max-width: 80%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
        }}
        .page-image .caption {{
            font-size: 0.9em;
            color: #666;
            font-style: italic;
            margin-top: 8px;
        }}

        /* --- Bibliografía --- */
        .bibliography p {{
            text-indent: -2em;
            padding-left: 2em;
            margin: 8px 0;
        }}
    </style>
</head>
<body>
{body}
</body>
</html>"""


def _render_cover(doc):
    """Renderiza la carátula del documento."""
    return f"""
    <div class="cover">
        <h1>{doc['title']}</h1>
        <div class="meta">
            <p><strong>Autor:</strong> {doc['author']}</p>
            <p><strong>Carnet:</strong> {doc['carnet']}</p>
            <p><strong>Fecha:</strong> {doc['date']}</p>
        </div>
        <div class="university">
            <p><em>Generado por El Tareinador</em></p>
        </div>
    </div>"""


def _render_toc(doc):
    """Renderiza el índice / tabla de contenidos."""
    items = []
    for i, page in enumerate(doc.get("pages", []), 1):
        items.append(f'        <li>{i}. {page.get("title", "Sin título")}</li>')

    items_html = "\n".join(items)
    return f"""
    <div class="toc">
        <h2>Índice</h2>
        <ul>
{items_html}
        </ul>
    </div>"""


def _render_page(page):
    """Renderiza una página individual del documento."""
    images_html = ""
    for img in page.get("images", []):
        caption_html = f'<div class="caption">{img.get("caption", "")}</div>' if img.get("caption") else ""
        images_html += f"""
        <div class="page-image">
            <img src="{img['url']}" alt="{img.get('caption', '')}">
            {caption_html}
        </div>"""

    section_class = "bibliography" if page.get("type") == "bibliografia" else ""

    return f"""
    <div class="page-section {section_class}">
        <h2>{page.get('title', '')}</h2>
        {page.get('content', '')}
        {images_html}
    </div>"""


def generate_pdf(doc):
    """
    Genera un archivo PDF del documento.
    - doc: diccionario del documento
    Retorna: ruta absoluta al PDF generado
    """
    html_content = build_document_html(doc)
    filename = f"tarea_{doc['id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_path = os.path.join(OUTPUT_DIR, filename)

    HTML(string=html_content).write_pdf(pdf_path)

    return pdf_path
