"""
construir.py -> genera los PNG y los PDF de los diagramas y mockups de InmoConecta.

Uso (desde cualquier carpeta):
    python -I construir.py               todo: PNG de cada HTML y los 3 PDF
    python -I construir.py png           solo los PNG
    python -I construir.py png <html>... solo los PNG de esos archivos
    python -I construir.py pdf           solo los PDF (usa los PNG ya generados)

Cada HTML de diagrama o pantalla declara su tamano con:
    <meta name="tam" content="1600x1000">
y opcionalmente la escala (por defecto 2):
    <meta name="escala" content="2">

Se usa Google Chrome en modo headless; no hace falta internet.
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

FUENTES = Path(__file__).resolve().parent
SALIDA = FUENTES.parent
PNG = SALIDA / "png"
CARPETAS = ["clases", "casos-uso", "mockups/android", "mockups/web", "mockups/navegacion"]

CHROME_CANDIDATOS = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

PDFS = [
    ("pdf-clases.html", "DIAGRAMA DE CLASES - InmoConecta Caracoli.pdf", "Diagrama de clases"),
    ("pdf-casos-uso.html", "CASOS DE USO - InmoConecta Caracoli.pdf", "Casos de uso"),
    ("pdf-mockups.html", "MOCKUPS - InmoConecta Caracoli.pdf", "Mockups"),
]


def chrome():
    for c in CHROME_CANDIDATOS:
        if os.path.exists(c):
            return c
    sys.exit("No se encontro Chrome ni Edge.")


def ejecutar_chrome(args):
    perfil = tempfile.mkdtemp(prefix="chrome-inmo-")
    base = [
        chrome(),
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--allow-file-access-from-files",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=4000",
        f"--user-data-dir={perfil}",
    ]
    r = subprocess.run(base + args, capture_output=True, text=True, timeout=180)
    return r


def leer_meta(html, nombre, defecto=None):
    texto = Path(html).read_text(encoding="utf-8")
    m = re.search(r'<meta\s+name="%s"\s+content="([^"]+)"' % nombre, texto)
    return m.group(1) if m else defecto


def destino_png(html):
    rel = Path(html).resolve().relative_to(FUENTES)
    return PNG / rel.parent / (rel.stem + ".png")


def generar_png(html):
    tam = leer_meta(html, "tam")
    if not tam:
        print(f"  (sin <meta name=tam>, se omite) {html}")
        return
    ancho, alto = tam.lower().split("x")
    escala = leer_meta(html, "escala", "2")
    salida = destino_png(html)
    salida.parent.mkdir(parents=True, exist_ok=True)
    if salida.exists():
        salida.unlink()
    r = ejecutar_chrome([
        f"--window-size={ancho},{alto}",
        f"--force-device-scale-factor={escala}",
        f"--screenshot={salida}",
        Path(html).resolve().as_uri(),
    ])
    if not salida.exists():
        print(r.stderr[-800:])
        sys.exit(f"Fallo el PNG de {html}")
    print(f"  PNG {salida.relative_to(SALIDA)}")


def todos_los_html():
    lista = []
    for c in CARPETAS:
        d = FUENTES / c
        if d.exists():
            lista += sorted(d.glob("*.html"))
    return lista


def encabezado_y_paginas(pdf, titulo):
    import pymupdf
    doc = pymupdf.open(pdf)
    fuente = r"C:\Windows\Fonts\arial.ttf"
    total = len(doc)
    for i, pagina in enumerate(doc):
        if i == 0:
            continue  # la portada va limpia
        r = pagina.rect
        txt = f"Caracoli Inmobiliaria · Sistema InmoConecta · {titulo}"
        pagina.insert_text((36, 24), txt, fontsize=8, fontname="arial", fontfile=fuente, color=(0.89, 0.08, 0.11))
        pagina.draw_line((36, 30), (r.width - 36, 30), color=(0.85, 0.85, 0.85), width=0.6)
        num = f"Página {i + 1} de {total}"
        pagina.insert_text((r.width - 36 - 60, r.height - 16), num, fontsize=8, fontname="arial", fontfile=fuente, color=(0.29, 0.29, 0.29))
    tmp = str(pdf) + ".tmp"
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    os.replace(tmp, pdf)


def generar_pdfs():
    for html, nombre, titulo in PDFS:
        fuente = FUENTES / html
        if not fuente.exists():
            print(f"  (no existe {html}, se omite)")
            continue
        salida = SALIDA / nombre
        if salida.exists():
            salida.unlink()
        r = ejecutar_chrome([
            "--no-pdf-header-footer",
            "--print-to-pdf-no-header",
            f"--print-to-pdf={salida}",
            fuente.as_uri(),
        ])
        if not salida.exists():
            print(r.stderr[-800:])
            sys.exit(f"Fallo el PDF {nombre}")
        encabezado_y_paginas(salida, titulo)
        print(f"  PDF {nombre}")


def main():
    args = sys.argv[1:]
    if not args or args[0] == "png":
        archivos = [Path(a) for a in args[1:]] if len(args) > 1 else todos_los_html()
        print("Generando PNG...")
        for h in archivos:
            generar_png(h)
    if not args or args[0] == "pdf":
        print("Generando PDF...")
        generar_pdfs()
    print("Listo.")


if __name__ == "__main__":
    main()
