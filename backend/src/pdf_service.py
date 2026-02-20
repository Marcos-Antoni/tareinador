"""
Servicio de generación de PDF.
- Construye HTML completo con todas las secciones
- Convierte HTML a PDF usando WeasyPrint como librería
"""
import os
from datetime import datetime
from weasyprint import HTML
from .config import OUTPUT_DIR
from .page_analyzer import calculate_page_map


def build_document_html(doc):
    """
    Construye el HTML completo del documento listo para PDF o preview.
    - doc: diccionario del documento con meta y pages
    Retorna: string HTML completo
    """
    sections_html = []

    # --- Carátula ---
    if "caratula" in doc.get("sections", []):
        sections_html.append(_render_cover(doc))

    # --- Índice con números de página reales ---
    if "indice" in doc.get("sections", []):
        page_map = calculate_page_map(doc)
        sections_html.append(_render_toc(page_map))

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
            justify-content: space-between;
            align-items: center;
            text-align: center;
            border: 3px double #1a2332;
            padding: 50px 40px;
            page-break-after: always;
        }}
        .cover-header {{
            margin-top: 20px;
        }}
        .cover-header .uni-name {{
            font-size: 1.4em;
            font-weight: bold;
            color: #1a2332;
            margin: 0;
        }}
        .cover-header .uni-center {{
            font-size: 1.1em;
            color: #333;
            margin: 4px 0 0 0;
        }}
        .cover-middle {{
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }}
        .cover-middle .carrera {{
            font-size: 1.05em;
            color: #444;
            margin-bottom: 8px;
        }}
        .cover-middle .docente {{
            font-size: 0.95em;
            color: #555;
            margin-bottom: 6px;
        }}
        .cover-middle .materia {{
            font-size: 1.1em;
            font-weight: bold;
            color: #333;
            margin-bottom: 6px;
        }}
        .cover-middle .semestre {{
            font-size: 0.95em;
            color: #555;
            margin-bottom: 30px;
        }}
        .cover-middle .work-title {{
            font-size: 1.8em;
            font-weight: bold;
            color: #1a2332;
            line-height: 1.3;
            margin: 0;
        }}
        .cover-footer {{
            margin-bottom: 20px;
        }}
        .cover-footer p {{
            margin: 5px 0;
            font-size: 1em;
            color: #333;
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
        .toc table {{
            width: 100%;
            border-collapse: collapse;
        }}
        .toc td {{
            padding: 8px 4px;
            border-bottom: 1px dotted #ccc;
            font-size: 1.05em;
        }}
        .toc td.toc-page {{
            text-align: right;
            width: 50px;
            font-weight: bold;
            color: #1a2332;
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
    """Renderiza la carátula del documento con todos los datos universitarios."""
    universidad = doc.get("universidad", "")
    centro = doc.get("centro", "")
    carrera = doc.get("carrera", "")
    docente = doc.get("docente", "")
    materia = doc.get("materia", "")
    semestre = doc.get("semestre", "")
    author = doc.get("author", "")
    carnet = doc.get("carnet", "")
    sede = doc.get("sede", "")
    title = doc.get("title", "")
    date = doc.get("date", "")

    # Construir sede + fecha
    sede_fecha = ""
    if sede:
        sede_fecha = f"{sede}, {date}"
    else:
        sede_fecha = date

    # Filas opcionales
    docente_html = f'<p class="docente">Docente: {docente}</p>' if docente else ""
    semestre_html = f'<p class="semestre">{semestre}</p>' if semestre else ""

    return f"""
    <div class="cover">
        <div class="cover-header">
            <p class="uni-name">{universidad}</p>
            <p class="uni-center">{centro}</p>
        </div>
        <div class="cover-middle">
            <p class="carrera">{carrera}</p>
            {docente_html}
            <p class="materia">{materia}</p>
            {semestre_html}
            <h1 class="work-title">{title}</h1>
        </div>
        <div class="cover-footer">
            <p><strong>Nombre:</strong> {author}</p>
            <p><strong>Carné:</strong> {carnet}</p>
            <p>{sede_fecha}</p>
        </div>
    </div>"""


def _render_toc(page_map):
    """
    Renderiza el índice con números de página calculados por el analizador.
    - page_map: lista de { "title": "...", "start_page": N }
    """
    rows = []
    for entry in page_map:
        title = entry["title"]
        page_num = entry["start_page"]
        rows.append(f'        <tr><td>{title}</td><td class="toc-page">{page_num}</td></tr>')

    rows_html = "\n".join(rows)
    return f"""
    <div class="toc">
        <h2>Índice</h2>
        <table>
{rows_html}
        </table>
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
