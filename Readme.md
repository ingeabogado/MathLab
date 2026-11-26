# MathLab — Solucionador de ecuaciones con Python en el navegador

Solucionador de ecuaciones lineales y cuadráticas en **React + TypeScript + Tailwind**:
los pasos, las soluciones y la gráfica se calculan con **Python real (Pyodide + SymPy)**
ejecutado en el navegador, sin servidor.

**Demo en vivo:** https://www.ingeabogado.com/dev/proyectos/mathlab

**Repositorio:** https://github.com/ingeabogado/MathLab

## Qué problema resuelve (valor de mercado)

- Estudiantes y docentes necesitan ver el procedimiento, no solo el resultado:
  MathLab muestra cada paso (forma estándar, coeficientes, discriminante, despeje).
- Correr Python en el navegador elimina el servidor: cero costos de cómputo,
  funciona offline tras la primera carga y escala gratis.
- Sirve como plantilla: cambia el código Python embebido y tienes cualquier
  herramienta de cálculo (estadística, finanzas, ingeniería) en una página.

## Lo que hace

- Ecuaciones lineales y cuadráticas en `x`, con notación flexible
  (`2x+3=11`, `x^2-5x+6=0`, `(x+1)(x-1)=0`).
- Pasos numerados, soluciones destacadas y gráfica cartesiana SVG con raíces marcadas.
- Casos borde con mensaje claro: sin soluciones reales, identidades, contradicciones,
  grado mayor a 2 y entradas inválidas.
- Carga diferida de Pyodide (~10 MB) al primer "Resolver", con indicador de progreso
  y reintento ante fallos de red.
- Responsive móvil→escritorio, targets táctiles ≥44px, gráfica con `role="img"` y etiquetas.

## Lo que demuestra (empleadores y clientes)

| Señal que buscan | Dónde verla |
|---|---|
| Python + frontend en un solo entregable | Solver SymPy embebido y ejecutado vía Pyodide (`mathlab/pyodide.ts`) |
| Piensa en producción, no en juguetes | Estados de carga, error y reintento; carga diferida del runtime pesado |
| Cuida la experiencia y el bundle | SVG propio en vez de una librería de gráficas; sin dependencias de cómputo |
| TypeScript estricto | `strict` + `noUnusedLocals`, resultado tipado de extremo a extremo |
| Accesibilidad y responsive reales | Formulario etiquetado, `role="img"`, 44px táctiles |
| Código legible y separado | Carga de Python, gráfica y vista en módulos independientes |

## Cómo correrlo

```bash
bun install
bun run dev      # desarrollo en http://localhost:5173
bun run build    # revisa tipos (tsc) y genera dist/
bun run preview  # sirve dist/ local
```

Con npm: `npm install`, `npm run dev`, `npm run build`.

## Estructura

```text
MathLab/
├── index.html            # entrada Vite
├── src/
│   ├── main.tsx          # bootstrap React
│   ├── App.tsx           # layout de la demo
│   ├── index.css         # tokens (Tailwind v4) + glass
│   └── mathlab/
│       ├── pyodide.ts    # loader Pyodide + solver SymPy embebido
│       ├── FunctionPlot.tsx # gráfica cartesiana SVG con raíces
│       └── MathLab.tsx   # vista: entrada, pasos, soluciones
├── Readme_MathLab.md
└── package.json
```

## Autor y licencia

Desarrollado por José Andrés Dávila L. 2026. Licencia libre con atribución al autor
(registro Creative Commons en trámite).
