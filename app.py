import os
import subprocess
from flask import Flask, render_template, request, send_file, redirect, url_for
from datetime import datetime

app = Flask(__name__)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'outputs')

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    title = request.form.get('title', 'Tarea sin título')
    content = request.form.get('content', '')
    author = request.form.get('author', 'Marco')
    date_str = datetime.now().strftime("%d de %B, %Y")
    
    # Generar HTML temporal
    html_content = render_template('pdf_template.html', 
                                   title=title, 
                                   content=content, 
                                   author=author, 
                                   date=date_str)
    
    html_path = os.path.join(OUTPUT_DIR, 'temp.html')
    pdf_path = os.path.join(OUTPUT_DIR, f'tarea_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf')
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Convertir a PDF usando WeasyPrint
    try:
        subprocess.run(['weasyprint', html_path, pdf_path], check=True)
        return send_file(pdf_path, as_attachment=True)
    except Exception as e:
        return f"Error generando PDF: {str(e)}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006)
