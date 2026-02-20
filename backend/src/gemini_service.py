"""
Servicio de integración con Gemini API.
- Generación de contenido académico con búsqueda web
- Edición de secciones con instrucciones del usuario
"""
import json
import re
from google import genai
from google.genai import types
from .config import GEMINI_API_KEY, GEMINI_MODEL

client = genai.Client(api_key=GEMINI_API_KEY)

# --- Herramienta de búsqueda Google ---
google_search_tool = types.Tool(google_search=types.GoogleSearch())


def generate_document(title, sections, author, carnet):
    """
    Genera el contenido completo del documento académico.
    - title: título del trabajo
    - sections: lista de secciones definidas por el usuario
      [{ "name": "...", "description": "...", "pages": N }]
    - author, carnet: datos del estudiante
    Retorna: lista de páginas [{type, title, content}]
    """
    sections_desc = _build_sections_prompt(sections)

    prompt = f"""Eres un asistente académico. Genera un trabajo/tarea universitario completo en español.

TÍTULO: {title}
AUTOR: {author}
CARNET: {carnet}

SECCIONES A GENERAR (con la cantidad de contenido especificada por el usuario):
{sections_desc}

INSTRUCCIONES:
- Investiga cada sección en internet para obtener información real y actualizada.
- Escribe contenido académico formal, bien estructurado y detallado.
- RESPETA ESTRICTAMENTE la cantidad de páginas indicada para cada sección.
- Una página de contenido equivale a MÁXIMO 250 palabras (contando títulos, subtítulos y espaciado).
- Si una sección es de 1 página, genera SOLO ~200-250 palabras. NO te pases.
- Si una sección tiene 2 páginas, genera ~400-500 palabras divididas en 2 bloques.
- Incluye un título <h2> al inicio de cada sección y usa <p> para párrafos.
- NO agregues contenido extra ni secciones adicionales que no se pidieron.
- Si alguna sección es de bibliografía, usa formato APA con fuentes reales.
- NO incluyas carátula ni índice en el JSON, esos se generan automáticamente.

Responde EXCLUSIVAMENTE con un JSON válido (sin markdown, sin ```json), con esta estructura:
{{
  "pages": [
    {{
      "type": "nombre_seccion_en_snake_case",
      "title": "Título visible de la sección",
      "content": "<p>Contenido HTML aquí...</p>"
    }}
  ]
}}

Si una sección tiene más de 1 página, genera múltiples objetos page con el mismo type pero contenido diferente.
Ejemplo: si "Desarrollo" tiene 3 páginas, genera 3 objetos con type="desarrollo" y "title" como "Desarrollo (1/3)", "Desarrollo (2/3)", "Desarrollo (3/3)".
Genera las secciones en el orden dado por el usuario.
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[google_search_tool],
                temperature=0.7,
            ),
        )

        raw = response.text.strip()
        parsed = _parse_json_response(raw)

        if parsed and "pages" in parsed:
            return parsed["pages"]
        else:
            return [{"type": "contenido", "title": title, "content": f"<p>{raw}</p>"}]

    except Exception as e:
        return [{
            "type": "error",
            "title": "Error de generación",
            "content": f"<p>Error al generar el contenido: {str(e)}</p>",
        }]


def edit_section(current_content, instructions):
    """
    Edita una sección existente según las instrucciones del usuario.
    - current_content: HTML actual de la sección
    - instructions: instrucciones del usuario en lenguaje natural
    Retorna: nuevo HTML de la sección
    """
    prompt = f"""Eres un asistente académico. Edita el siguiente contenido HTML según las instrucciones del usuario.

CONTENIDO ACTUAL:
{current_content}

INSTRUCCIONES DEL USUARIO:
{instructions}

REGLAS:
- Mantén el formato HTML (párrafos, títulos, listas, etc).
- Solo modifica lo que el usuario pidió, mantén el resto igual.
- Responde SOLO con el HTML editado, sin explicaciones adicionales, sin markdown.
"""

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[google_search_tool],
                temperature=0.5,
            ),
        )
        result = response.text.strip()
        # Limpiar posibles bloques de código markdown
        result = re.sub(r'^```html\s*', '', result)
        result = re.sub(r'\s*```$', '', result)
        return result

    except Exception as e:
        return f"<p>Error al editar: {str(e)}</p>"


def _build_sections_prompt(sections):
    """Construye la descripción de secciones definidas por el usuario para el prompt."""
    lines = []
    for i, sec in enumerate(sections, 1):
        name = sec.get("name", f"Sección {i}")
        desc = sec.get("description", "")
        pages = sec.get("pages", 1)
        line = f"{i}. **{name}** — {pages} página(s)"
        if desc:
            line += f"\n   Instrucciones: {desc}"
        lines.append(line)
    return "\n".join(lines)


def _parse_json_response(raw):
    """
    Intenta parsear JSON de la respuesta de Gemini.
    - Limpia bloques de código markdown si los hay
    - Intenta extraer JSON si está envuelto en texto
    """
    # Remover bloques de markdown ```json ... ```
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw)
    cleaned = re.sub(r'\s*```$', '', cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Intentar encontrar JSON dentro del texto
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None
