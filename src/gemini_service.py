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


def generate_document(topic, title, sections, author, carnet):
    """
    Genera el contenido completo del documento académico.
    - topic: descripción del tema a investigar
    - title: título del trabajo
    - sections: lista de secciones seleccionadas (e.g. ["caratula","indice","introduccion","conclusion","bibliografia"])
    - author, carnet: datos del estudiante
    Retorna: lista de páginas [{type, title, content}]
    """
    sections_desc = _build_sections_prompt(sections)

    prompt = f"""Eres un asistente académico. Genera un trabajo/tarea universitario completo en español.

TEMA: {topic}
TÍTULO: {title}
AUTOR: {author}
CARNET: {carnet}

SECCIONES A GENERAR:
{sections_desc}

INSTRUCCIONES:
- Investiga el tema en internet para obtener información real y actualizada.
- Escribe contenido académico formal, bien estructurado y detallado.
- Cada sección debe tener contenido sustancial (mínimo 2-3 párrafos para el cuerpo).
- Usa HTML para el formato del contenido (párrafos <p>, títulos <h2>/<h3>, listas <ul>/<ol>, negritas <strong>, etc).
- NO incluyas la carátula ni el índice en el contenido HTML, esos se generan automáticamente.
- Si hay bibliografía, usa formato APA con fuentes reales que encontraste.

Responde EXCLUSIVAMENTE con un JSON válido (sin markdown, sin ```json), con esta estructura:
{{
  "pages": [
    {{
      "type": "tipo_seccion",
      "title": "Título de la sección",
      "content": "<p>Contenido HTML aquí...</p>"
    }}
  ]
}}

Los tipos válidos son: "introduccion", "contenido", "conclusion", "bibliografia".
NO incluyas "caratula" ni "indice" en las pages, esos se manejan aparte.
Genera las secciones en orden lógico. Si el usuario pidió introducción, ponla primero, luego contenido principal (puedes dividirlo en varias pages), luego conclusión, y bibliografía al final.
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
    """Construye la descripción de secciones para el prompt."""
    desc = []
    section_map = {
        "caratula": "Carátula (se genera automáticamente, NO la incluyas en el JSON)",
        "indice": "Índice / Tabla de contenidos (se genera automáticamente, NO lo incluyas en el JSON)",
        "introduccion": "Introducción al tema",
        "contenido": "Desarrollo/Cuerpo principal del trabajo (investigado con fuentes reales)",
        "conclusion": "Conclusión",
        "bibliografia": "Bibliografía en formato APA con fuentes reales",
    }
    # Siempre agregar contenido principal
    has_contenido = False
    for s in sections:
        if s in section_map:
            desc.append(f"- {section_map[s]}")
        if s == "contenido":
            has_contenido = True

    if not has_contenido:
        desc.append(f"- {section_map['contenido']}")

    return "\n".join(desc)


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
