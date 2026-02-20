"""
Analizador de contenido para calcular cuántas páginas ocupa el HTML.
Simula el layout de una página tamaño carta con márgenes de 2.5cm:
  - Área útil: ~16cm ancho × ~21.6cm alto
  - Fuente 12pt, line-height 1.8 → cada línea ≈ 7.6mm
  - ~28 líneas útiles por página
  - ~11 palabras promedio por línea
  - ~300 palabras de texto plano por página
"""
import re
from html.parser import HTMLParser


# ─── Constantes de layout (tamaño carta, márgenes 2.5cm, 12pt, line-height 1.8) ───
LINES_PER_PAGE = 28        # líneas útiles por página
WORDS_PER_LINE = 11        # palabras promedio por línea de texto
WORDS_PER_PAGE = LINES_PER_PAGE * WORDS_PER_LINE  # ~308

# Costo en líneas de cada elemento HTML
ELEMENT_LINES = {
    "h1": 4,    # título grande + márgenes
    "h2": 3,    # subtítulo + border-bottom + márgenes
    "h3": 2.5,  # subtítulo menor + márgenes
    "h4": 2,
    "p": 0.8,   # margen inferior del párrafo (el texto se cuenta aparte)
    "br": 1,
    "hr": 2,
    "li": 0.5,  # margen extra por item de lista
    "ul": 1,    # padding/margin del bloque
    "ol": 1,
    "img": 10,  # imagen ocupa ~10 líneas
    "table": 2, # márgenes de tabla
    "tr": 1,
    "blockquote": 1.5,
}


class _ContentParser(HTMLParser):
    """Parser que extrae texto y elementos estructurales del HTML."""

    def __init__(self):
        super().__init__()
        self.total_lines = 0.0
        self._current_text = []
        self._in_heading = False

    def handle_starttag(self, tag, attrs):
        # Flush text antes del nuevo elemento
        self._flush_text()
        # Sumar líneas del elemento
        tag_lower = tag.lower()
        self.total_lines += ELEMENT_LINES.get(tag_lower, 0)
        if tag_lower in ("h1", "h2", "h3", "h4"):
            self._in_heading = True

    def handle_endtag(self, tag):
        self._flush_text()
        if tag.lower() in ("h1", "h2", "h3", "h4"):
            self._in_heading = False

    def handle_data(self, data):
        self._current_text.append(data)

    def _flush_text(self):
        if not self._current_text:
            return
        text = " ".join(self._current_text).strip()
        self._current_text = []
        if not text:
            return
        words = len(text.split())
        lines = words / WORDS_PER_LINE
        self.total_lines += lines


def estimate_pages(html_content):
    """
    Estima cuántas páginas físicas ocupa el contenido HTML.
    - html_content: string con HTML del contenido
    Retorna: número de páginas (mínimo 1)
    """
    if not html_content:
        return 1

    parser = _ContentParser()
    try:
        parser.feed(html_content)
        parser._flush_text()  # flush final
    except Exception:
        # Fallback: contar palabras si el parser falla
        text = re.sub(r'<[^>]+>', ' ', html_content)
        words = len(text.split())
        return max(1, round(words / WORDS_PER_PAGE))

    pages = parser.total_lines / LINES_PER_PAGE
    return max(1, round(pages))


def calculate_page_map(doc):
    """
    Calcula en qué página comienza cada sección del documento.
    - doc: diccionario del documento
    Retorna: lista de dicts [{ "title": "...", "start_page": N }]
    """
    current_page = 1

    # Carátula siempre ocupa exactamente 1 página
    if "caratula" in doc.get("sections", []):
        current_page += 1

    # Índice siempre ocupa exactamente 1 página
    if "indice" in doc.get("sections", []):
        current_page += 1

    page_map = []
    for page in doc.get("pages", []):
        title = page.get("title", "Sin título")
        page_map.append({
            "title": title,
            "start_page": current_page,
        })
        # Estimar cuántas páginas ocupa esta sección
        content = page.get("content", "")
        pages_used = estimate_pages(content)
        current_page += pages_used

    return page_map
