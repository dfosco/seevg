# SEEVG – SVG Inspector

A visual SVG code inspector that lets you explore and understand SVG files by linking visual elements with their code representation in real-time.

![SEEVG Screenshot](https://via.placeholder.com/800x400?text=SEEVG+Screenshot)

## Features

- **🔍 Visual-Code Sync**: Hover over SVG elements to highlight corresponding code
- **🔒 Lock Elements**: Click any element to lock focus and scroll to its code
- **✨ Smart Formatting**: Automatically formats pasted SVG with proper indentation and line wrapping
- **🎨 Interactive Highlighting**: Elements are highlighted with their own colors for better visual feedback
- **🌓 Theme Toggle**: Switch between dark and light backgrounds
- **🔎 Zoom Control**: Zoom in/out to inspect details (25% - 300%)
- **📝 Live Code Editor**: Edit SVG code with syntax highlighting powered by CodeMirror

## Usage

### Online

Visit the [live demo](https://dfosco.github.io/seevg) (replace with actual URL)

### Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

1. **Paste or edit** your SVG code in the editor
2. **Hover** over elements in the preview to see the corresponding code
3. **Click** any element to lock focus and navigate to its code
4. **Zoom** and toggle background to better inspect your SVG

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **CodeMirror 6** - Code editor with XML/SVG syntax highlighting
- **Tailwind CSS 4** - Utility-first CSS framework
- **Base Web** - UI components library

## Development

```bash
# Run linter
npm run lint

# Deploy to GitHub Pages
npm run deploy
```

## License

MIT

## Credits

Default SVG illustration by [unDraw](https://undraw.co/)
