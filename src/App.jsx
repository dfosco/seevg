import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { EditorView, Decoration, placeholder } from '@codemirror/view'
import { EditorState, StateField, StateEffect } from '@codemirror/state'
import { xml } from '@codemirror/lang-xml'
import { basicSetup } from 'codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { Tag } from 'baseui/tag'

// Format SVG/XML with proper indentation and line wrapping
function formatSvg(svgString, maxLineWidth = 90) {
  const INDENT = '  '
  
  // Step 1: Format with one tag per line
  const cleaned = svgString.replace(/>\s+</g, '><').trim()
  const tokens = cleaned.split(/(<[^>]+>)/g).filter(Boolean)
  
  let formatted = ''
  let indent = 0
  
  for (const token of tokens) {
    if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1)
      formatted += INDENT.repeat(indent) + token + '\n'
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      formatted += INDENT.repeat(indent) + token + '\n'
    } else if (token.startsWith('<?') || token.startsWith('<!')) {
      formatted += token + '\n'
    } else if (token.startsWith('<')) {
      formatted += INDENT.repeat(indent) + token + '\n'
      indent++
    } else if (token.trim()) {
      formatted += INDENT.repeat(indent) + token.trim() + '\n'
    }
  }
  
  // Step 2-4: Break lines that exceed maxLineWidth at property boundaries
  const lines = formatted.split('\n')
  const result = []
  
  for (const line of lines) {
    // Step 2: Detect lines that exceed limit
    // Only apply LINE_WIDTH_OFFSET if line is longer than the offset itself
    const effectiveMaxWidth = line.length >= LINE_WIDTH_OFFSET 
      ? maxLineWidth - LINE_WIDTH_OFFSET 
      : maxLineWidth
    
    if (line.length <= effectiveMaxWidth) {
      result.push(line)
      continue
    }
    
    const leadingWhitespace = line.match(/^(\s*)/)[1]
    const attrIndent = leadingWhitespace + INDENT
    const attrIndentLen = attrIndent.length
    
    // Step 3 & 4: Find where limit is reached and break after the property that contains/follows it
    let currentLine = line
    const wrappedLines = []
    let isFirstLine = true
    
    while (currentLine.length > effectiveMaxWidth) {
      // For continuation lines, account for the indent that will be added
      const currentMaxWidth = isFirstLine 
        ? effectiveMaxWidth 
        : effectiveMaxWidth - attrIndentLen + currentLine.match(/^(\s*)/)[1].length
      
      // Find valid break points: spaces between complete attributes (X="..." Y="...")
      // Match complete attributes and find spaces after them
      let breakPos = -1
      const attrPattern = /[\w:-]+="[^"]*"/g
      let match
      let lastEndPos = -1
      
      while ((match = attrPattern.exec(currentLine)) !== null) {
        const endPos = match.index + match[0].length
        // Check if there's a space after this attribute
        if (currentLine[endPos] === ' ') {
          if (endPos <= currentMaxWidth) {
            lastEndPos = endPos
          } else if (lastEndPos === -1) {
            // First valid break after limit
            lastEndPos = endPos
            break
          } else {
            break
          }
        }
      }
      
      breakPos = lastEndPos
      
      // If still no valid break point, don't break - keep line as is
      if (breakPos === -1) {
        break
      }
      
      wrappedLines.push(currentLine.substring(0, breakPos).trimEnd())
      currentLine = attrIndent + currentLine.substring(breakPos).trimStart()
      isFirstLine = false
    }
    
    // Add remaining content (or entire line if no breaks were made)
    if (currentLine.trim()) {
      wrappedLines.push(currentLine)
    }
    
    // If no valid breaks found, just keep original line
    if (wrappedLines.length === 0) {
      result.push(line)
    } else {
      result.push(...wrappedLines)
    }
  }
  
  return result.join('\n').trim()
}

const defaultSvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="379.356" viewBox="0 0 800 379.356" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" artist="Katerina Limpitsouni" source="https://undraw.co/"><g transform="translate(-400 -159)"><path d="M4.094,0H159.657a4.094,4.094,0,0,1,4.094,4.094v100.98a4.094,4.094,0,0,1-4.094,4.094H4.094A4.094,4.094,0,0,1,0,105.073V4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(400 159)" fill="#fff"/><path d="M4.094,1.365A2.732,2.732,0,0,0,1.365,4.094v100.98A2.732,2.732,0,0,0,4.094,107.8H159.657a2.732,2.732,0,0,0,2.729-2.729V4.094a2.732,2.732,0,0,0-2.729-2.729H4.094M4.094,0H159.657a4.094,4.094,0,0,1,4.094,4.094v100.98a4.094,4.094,0,0,1-4.094,4.094H4.094A4.094,4.094,0,0,1,0,105.073V4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(400 159)" fill="#090814"/><path d="M2.729,0H158.292a2.729,2.729,0,0,1,2.729,2.729V16.375H0V2.729A2.729,2.729,0,0,1,2.729,0Z" transform="translate(401.365 160.365)" fill="#6c63ff"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(416.375 193.115)" fill="#090814"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(468.229 193.115)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(416.375 217.677)" fill="#090814"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(468.229 217.677)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(416.375 242.24)" fill="#090814"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(468.229 242.24)" fill="#e6e6e6"/><g transform="translate(678.376 160.365)"><rect width="163" height="156" rx="6" transform="translate(0.624 -0.008)" fill="#fff"/><path d="M4.094,1.308A2.677,2.677,0,0,0,1.365,3.923V153a2.677,2.677,0,0,0,2.729,2.615H159.657A2.677,2.677,0,0,0,162.386,153V3.923a2.677,2.677,0,0,0-2.729-2.615H4.094M4.094,0H159.657a4.011,4.011,0,0,1,4.094,3.923V153a4.011,4.011,0,0,1-4.094,3.923H4.094A4.011,4.011,0,0,1,0,153V3.923A4.011,4.011,0,0,1,4.094,0Z" fill="#090814"/><path d="M2.729,0H158.292a2.729,2.729,0,0,1,2.729,2.729V16.375H0V2.729A2.729,2.729,0,0,1,2.729,0Z" transform="translate(1.365 1.365)" fill="#6c63ff"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.375 34.115)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.229 34.115)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.375 58.677)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.229 58.677)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.375 83.24)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.229 83.24)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.375 107.803)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.229 107.803)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.375 132.365)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.229 132.365)" fill="#e6e6e6"/></g><rect width="164" height="158" rx="6" transform="translate(498 380.356)" fill="#fff"/><path d="M4.094,1.308A2.677,2.677,0,0,0,1.365,3.923V153a2.677,2.677,0,0,0,2.729,2.615H159.657A2.677,2.677,0,0,0,162.386,153V3.923a2.677,2.677,0,0,0-2.729-2.615H4.094M4.094,0H159.657a4.011,4.011,0,0,1,4.094,3.923V153a4.011,4.011,0,0,1-4.094,3.923H4.094A4.011,4.011,0,0,1,0,153V3.923A4.011,4.011,0,0,1,4.094,0Z" transform="translate(498.25 381.428)" fill="#090814"/><path d="M2.729,0H158.292a2.729,2.729,0,0,1,2.729,2.729V16.375H0V2.729A2.729,2.729,0,0,1,2.729,0Z" transform="translate(499.615 382.793)" fill="#6c63ff"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(514.625 415.543)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(566.48 415.543)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(514.625 440.105)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(566.48 440.105)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(514.625 464.668)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(566.48 464.668)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(514.625 489.231)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(566.48 489.231)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(514.625 513.793)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(566.48 513.793)" fill="#e6e6e6"/><path d="M4.094,0H159.657a4.094,4.094,0,0,1,4.094,4.094v100.98a4.094,4.094,0,0,1-4.094,4.094H4.094A4.094,4.094,0,0,1,0,105.073V4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(857.137 373.923)" fill="#fff"/><path d="M4.094,1.365A2.732,2.732,0,0,0,1.365,4.094v100.98A2.732,2.732,0,0,0,4.094,107.8H159.657a2.732,2.732,0,0,0,2.729-2.729V4.094a2.732,2.732,0,0,0-2.729-2.729H4.094M4.094,0H159.657a4.094,4.094,0,0,1,4.094,4.094v100.98a4.094,4.094,0,0,1-4.094,4.094H4.094A4.094,4.094,0,0,1,0,105.073V4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(857.137 373.923)" fill="#090814"/><path d="M2.729,0H158.292a2.729,2.729,0,0,1,2.729,2.729V16.375H0V2.729A2.729,2.729,0,0,1,2.729,0Z" transform="translate(858.502 375.287)" fill="#6c63ff"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(873.512 408.038)" fill="#090814"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(925.367 408.038)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(873.512 432.6)" fill="#090814"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(925.367 432.6)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(873.512 457.163)" fill="#090814"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(925.367 457.163)" fill="#e6e6e6"/><path d="M93.005,104.731h5.472V51.338H1.027A1.026,1.026,0,0,1,0,50.313V1.028a1.026,1.026,0,1,1,2.052,0V49.284H99.5a1.029,1.029,0,0,1,1.027,1.028v54.418H106L99.5,115Z" transform="translate(481 267.356)" fill="#090814"/><path d="M0,6,10.191,0V5.052H195.982A.987.987,0,0,1,197,6a.985.985,0,0,1-1.018.947H10.191V12Z" transform="translate(661 430.356)" fill="#090814"/><path d="M97.945,140.983V7.474H10.275V12.91L0,6.454,10.275,0V5.434h88.7A1.025,1.025,0,0,1,100,6.454V140.983a1.028,1.028,0,0,1-2.055,0Z" transform="translate(841 232.356)" fill="#090814"/><g transform="translate(1035.833 160.365)"><rect width="164" height="156" rx="6" transform="translate(0.167 -0.008)" fill="#fff"/><path d="M4.094,1.308A2.677,2.677,0,0,0,1.365,3.923V153a2.677,2.677,0,0,0,2.729,2.615H159.657A2.677,2.677,0,0,0,162.386,153V3.923a2.677,2.677,0,0,0-2.729-2.615H4.094M4.094,0H159.657a4.011,4.011,0,0,1,4.094,3.923V153a4.011,4.011,0,0,1-4.094,3.923H4.094A4.011,4.011,0,0,1,0,153V3.923A4.011,4.011,0,0,1,4.094,0Z" transform="translate(0.065)" fill="#090814"/><path d="M2.729,0H158.292a2.729,2.729,0,0,1,2.729,2.729V16.375H0V2.729A2.729,2.729,0,0,1,2.729,0Z" transform="translate(1.43 1.365)" fill="#6c63ff"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.44 34.115)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.295 34.115)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.44 58.677)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.295 58.677)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.44 83.24)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.295 83.24)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.44 107.803)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.295 107.803)" fill="#e6e6e6"/><path d="M4.094,0H31.386a4.094,4.094,0,1,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(16.44 132.365)" fill="#6c63ff"/><path d="M4.094,0H77.782a4.094,4.094,0,0,1,0,8.188H4.094A4.094,4.094,0,0,1,4.094,0Z" transform="translate(68.295 132.365)" fill="#e6e6e6"/></g><g transform="translate(1019.167 316.61)"><path d="M-.477,119.948A1.023,1.023,0,0,1-1.5,118.925V-.477A1.023,1.023,0,0,1-.477-1.5,1.023,1.023,0,0,1,.547-.477v119.4A1.023,1.023,0,0,1-.477,119.948Z" transform="translate(99.425 1.5)" fill="#090814"/><path d="M93.68.547H-.477A1.023,1.023,0,0,1-1.5-.477,1.023,1.023,0,0,1-.477-1.5H93.68A1.023,1.023,0,0,1,94.7-.477,1.023,1.023,0,0,1,93.68.547Z" transform="translate(5.268 120.902)" fill="#090814"/><path d="M6.5,0,13,10H0Z" transform="translate(-0.167 126.746) rotate(-90)" fill="#090814"/></g></g></svg>`

// Adjust this to account for padding, line numbers, gutters, etc.
const LINE_WIDTH_OFFSET = 16

// Calculate max characters based on pixel width (18px font, ~0.6em char width)
const getMaxChars = (pixelWidth) => Math.floor(pixelWidth / (18 * 0.6))

const setHighlight = StateEffect.define()
const setLockedHighlight = StateEffect.define()

const highlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setHighlight)) {
        if (effect.value.from === -1) {
          return Decoration.none
        }
        const mark = Decoration.mark({ class: 'cm-highlight' })
        return Decoration.set([mark.range(effect.value.from, effect.value.to)])
      }
    }
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

const lockedHighlightField = StateField.define({
  create() {
    return Decoration.none
  },
  update(decorations, tr) {
    for (let effect of tr.effects) {
      if (effect.is(setLockedHighlight)) {
        if (effect.value.from === -1) {
          return Decoration.none
        }
        const mark = Decoration.mark({ class: 'cm-highlight-locked' })
        return Decoration.set([mark.range(effect.value.from, effect.value.to)])
      }
    }
    return decorations
  },
  provide: f => EditorView.decorations.from(f)
})

const editorTheme = EditorView.theme({
  '&': { 
    height: '100%',
    fontSize: '18px',
  },
  '.cm-scroller': { 
    overflow: 'auto',
    fontFamily: '"Monaspace Neon", monospace',
    padding: '16px 0',
  },
  '.cm-content': {
    padding: '0 16px',
  },
  '.cm-highlight': { 
    backgroundColor: '#0c1222 !important',
    borderRadius: '2px',
    outline: '2px solid #0c1222',
    outlineOffset: '0px',
  },
  '.cm-highlight span': {
    color: '#94a3b8 !important',
  },
  '.cm-highlight-locked': { 
    backgroundColor: '#0c1222 !important',
    borderRadius: '2px',
    outline: '2px solid #0c1222',
    outlineOffset: '0px',
    position: 'relative',
  },
  '.cm-highlight-locked span': {
    color: '#94a3b8 !important',
  },
  '.cm-highlight-locked::before': {
    content: '""',
    position: 'absolute',
    left: '-12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
  },
  '.cm-gutters': {
    backgroundColor: '#0f172a',
    borderRight: '1px solid #1e293b',
    paddingLeft: '8px',
  },
  '.cm-placeholder': {
    color: '#475569',
    fontStyle: 'italic',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1e293b',
  },
  '.cm-activeLine': {
    backgroundColor: '#1e293b40',
  }
})

function App() {
  const [svgCode, setSvgCode] = useState(null) // Start null, format after mount
  const [hoveredElement, setHoveredElement] = useState(null)
  const [lockedElement, setLockedElement] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [darkBg, setDarkBg] = useState(true)
  const editorRef = useRef(null)
  const editorViewRef = useRef(null)
  const svgContainerRef = useRef(null)
  const lockedLineRef = useRef(null) // Track locked line position
  const lockedSvgElementRef = useRef(null) // Track locked SVG element for styles

  // Memoize SVG HTML to prevent re-render when lockedElement state changes
  const svgHtml = useMemo(() => ({ __html: svgCode }), [svgCode])

  const zoomIn = () => setZoom(z => Math.min(z + 25, 300))
  const zoomOut = () => setZoom(z => Math.max(z - 25, 25))
  const resetZoom = () => setZoom(100)

  useEffect(() => {
    if (!editorRef.current || editorViewRef.current) return

    // Calculate max chars based on editor width
    const editorWidth = editorRef.current.clientWidth
    const maxChars = getMaxChars(editorWidth)
    
    // Format default SVG with dynamic width
    const initialSvg = formatSvg(defaultSvgRaw, maxChars)
    setSvgCode(initialSvg)

    const pasteHandler = EditorView.domEventHandlers({
      paste(event, view) {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false
        
        const text = clipboardData.getData('text/plain')
        if (!text || !text.includes('<svg') && !text.includes('<SVG')) return false
        
        event.preventDefault()
        
        // Calculate max line width in characters based on editor width
        const maxChars = getMaxChars(view.dom.clientWidth)
        
        const formatted = formatSvg(text, maxChars)
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted }
        })
        
        return true
      }
    })

    const state = EditorState.create({
      doc: initialSvg,
      extensions: [
        basicSetup,
        xml(),
        oneDark,
        highlightField,
        lockedHighlightField,
        editorTheme,
        pasteHandler,
        placeholder('Paste your SVG'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSvgCode(update.state.doc.toString())
          }
        }),
      ]
    })

    editorViewRef.current = new EditorView({
      state,
      parent: editorRef.current
    })

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy()
        editorViewRef.current = null
      }
    }
  }, [])

  const getElementColor = useCallback((element) => {
    // Get the fill color of the element
    const fill = window.getComputedStyle(element).fill
    const stroke = window.getComputedStyle(element).stroke
    
    // Return fill if it exists and is not 'none', otherwise return stroke
    if (fill && fill !== 'none' && !fill.includes('none')) {
      return fill
    }
    if (stroke && stroke !== 'none' && !stroke.includes('none')) {
      return stroke
    }
    return '#3b82f6' // fallback blue
  }, [])

  const mixColorWithBackground = useCallback((element, isDarkBg) => {
    const fill = window.getComputedStyle(element).fill
    
    if (!fill || fill === 'none' || fill.includes('none')) {
      return null // no fill to mix
    }
    
    // Parse RGB from fill
    const matches = fill.match(/\d+/g)
    if (!matches || matches.length < 3) return null
    
    const r = parseInt(matches[0])
    const g = parseInt(matches[1])
    const b = parseInt(matches[2])
    
    // Mix with black (darken) for dark bg, mix with white (lighten) for light bg
    const mixAmount = 0.4
    let newR, newG, newB
    
    if (isDarkBg) {
      // Darken: mix toward black
      newR = Math.round(r * (1 - mixAmount))
      newG = Math.round(g * (1 - mixAmount))
      newB = Math.round(b * (1 - mixAmount))
    } else {
      // Lighten: mix toward white
      newR = Math.round(r + (255 - r) * mixAmount)
      newG = Math.round(g + (255 - g) * mixAmount)
      newB = Math.round(b + (255 - b) * mixAmount)
    }
    
    return `rgb(${newR}, ${newG}, ${newB})`
  }, [])

  const findElementPosition = useCallback((element) => {
    if (!element || !editorViewRef.current) return null

    const tagName = element.tagName.toLowerCase()
    const code = editorViewRef.current.state.doc.toString()
    
    // Get the path from svg root to this element to find the correct occurrence
    const getElementPath = (el) => {
      const path = []
      let current = el
      while (current && current.tagName && current.tagName.toLowerCase() !== 'svg') {
        const parent = current.parentElement
        if (parent) {
          const siblings = Array.from(parent.children).filter(
            c => c.tagName === current.tagName
          )
          const index = siblings.indexOf(current)
          path.unshift({ tag: current.tagName.toLowerCase(), index, total: siblings.length })
        }
        current = parent
      }
      return path
    }

    const elementPath = getElementPath(element)
    
    // Find all occurrences of this tag and pick the right one based on path
    const allMatches = [...code.matchAll(new RegExp(`<${tagName}[^>]*(?:>|/>)`, 'gi'))]
    
    // Try to match by first attribute for uniqueness
    const firstAttr = element.attributes[0]
    let matchIndex = -1
    
    if (firstAttr) {
      const attrPattern = `${firstAttr.name}="${firstAttr.value}"`
      matchIndex = allMatches.findIndex(m => m[0].includes(attrPattern))
    }
    
    // Fallback to position-based matching
    if (matchIndex === -1 && elementPath.length > 0) {
      const lastPath = elementPath[elementPath.length - 1]
      matchIndex = lastPath.index
    }
    
    if (matchIndex === -1) matchIndex = 0
    
    const match = allMatches[matchIndex]
    if (match) {
      return { from: match.index, to: match.index + match[0].length }
    }
    return null
  }, [])

  const findElementInCode = useCallback((element) => {
    const pos = findElementPosition(element)
    if (pos && editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: setHighlight.of(pos)
      })

      // Only scroll if not locked
      if (!lockedLineRef.current) {
        editorViewRef.current.dispatch({
          effects: EditorView.scrollIntoView(pos.from, { y: 'center' })
        })
      }
    }
  }, [findElementPosition])

  const currentHoveredRef = useRef(null)

  const clearCurrentHighlight = useCallback(() => {
    if (currentHoveredRef.current && currentHoveredRef.current !== lockedSvgElementRef.current) {
      const el = currentHoveredRef.current
      el.setAttribute('stroke', el.dataset.originalStroke === 'none' ? '' : el.dataset.originalStroke || '')
      el.setAttribute('stroke-width', el.dataset.originalStrokeWidth || '')
      if (el.dataset.originalFill) {
        el.setAttribute('fill', el.dataset.originalFill === 'none' ? '' : el.dataset.originalFill)
      }
      el.style.paintOrder = ''
    }
    currentHoveredRef.current = null
    setHoveredElement(null)
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: setHighlight.of({ from: -1, to: -1 })
      })
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    // If locked, don't do any hover highlighting
    if (lockedSvgElementRef.current) {
      return
    }
    
    const target = e.target
    
    // Ignore if target is the container or the svg root itself
    if (target === svgContainerRef.current || target.tagName?.toLowerCase() === 'svg') {
      clearCurrentHighlight()
      return
    }
    
    // Check if target is inside our SVG
    const svg = svgContainerRef.current?.querySelector('svg')
    if (!svg || !svg.contains(target)) {
      clearCurrentHighlight()
      return
    }
    
    // If same element, do nothing
    if (target === currentHoveredRef.current) {
      return
    }
    
    // Clear previous highlight (but not if it's the locked element)
    if (currentHoveredRef.current && currentHoveredRef.current !== lockedSvgElementRef.current) {
      const el = currentHoveredRef.current
      el.setAttribute('stroke', el.dataset.originalStroke === 'none' ? '' : el.dataset.originalStroke || '')
      el.setAttribute('stroke-width', el.dataset.originalStrokeWidth || '')
      if (el.dataset.originalFill) {
        el.setAttribute('fill', el.dataset.originalFill === 'none' ? '' : el.dataset.originalFill)
      }
      el.style.paintOrder = ''
    }
    
    // Highlight new element
    currentHoveredRef.current = target
    
    // Only store original values if this is NOT the locked element
    // (locked element already has its originals stored)
    if (target !== lockedSvgElementRef.current) {
      target.dataset.originalStroke = target.getAttribute('stroke') || 'none'
      target.dataset.originalStrokeWidth = target.getAttribute('stroke-width') || ''
      target.dataset.originalFill = target.getAttribute('fill') || 'none'
      
      // Get the element's color for the stroke
      const elementColor = getElementColor(target)
      
      // Mix fill color with background
      const mixedFill = mixColorWithBackground(target, darkBg)
      if (mixedFill) {
        target.setAttribute('fill', mixedFill)
      }
      
      // Apply highlight: 4px stroke with paint-order to show 2px outside
      target.setAttribute('stroke', elementColor)
      target.setAttribute('stroke-width', '4')
      target.style.paintOrder = 'stroke fill'
    }
    
    setHoveredElement(target.tagName.toLowerCase())
    findElementInCode(target)
  }, [findElementInCode, clearCurrentHighlight, getElementColor, mixColorWithBackground, darkBg])

  const handleClick = useCallback((e) => {
    const target = e.target
    
    // Click outside SVG elements clears lock
    if (target === svgContainerRef.current || target.tagName?.toLowerCase() === 'svg') {
      clearLock()
      return
    }
    
    // Check if target is inside our SVG
    const svg = svgContainerRef.current?.querySelector('svg')
    if (!svg || !svg.contains(target)) {
      clearLock()
      return
    }
    
    // If clicking the same locked element, unlock it and re-apply hover
    if (lockedSvgElementRef.current === target) {
      clearLock()
      // Re-apply hover styles since we're still on this element
      currentHoveredRef.current = target
      target.dataset.originalStroke = target.getAttribute('stroke') || 'none'
      target.dataset.originalStrokeWidth = target.getAttribute('stroke-width') || ''
      target.dataset.originalFill = target.getAttribute('fill') || 'none'
      
      const elementColor = getElementColor(target)
      const mixedFill = mixColorWithBackground(target, darkBg)
      if (mixedFill) {
        target.setAttribute('fill', mixedFill)
      }
      target.setAttribute('stroke', elementColor)
      target.setAttribute('stroke-width', '4')
      target.style.paintOrder = 'stroke fill'
      
      setHoveredElement(target.tagName.toLowerCase())
      findElementInCode(target)
      return
    }
    
    // Clear previous locked element styles
    if (lockedSvgElementRef.current) {
      const el = lockedSvgElementRef.current
      el.setAttribute('stroke', el.dataset.originalStroke === 'none' ? '' : el.dataset.originalStroke || '')
      el.setAttribute('stroke-width', el.dataset.originalStrokeWidth || '')
      if (el.dataset.originalFill) {
        el.setAttribute('fill', el.dataset.originalFill === 'none' ? '' : el.dataset.originalFill)
      }
      el.style.paintOrder = ''
    }
    
    // Lock this element - styles are already applied from hover, just store the ref
    lockedSvgElementRef.current = target
    lockedLineRef.current = null
    
    // Store locked line position and apply locked highlight
    const pos = findElementPosition(target)
    if (pos && editorViewRef.current) {
      lockedLineRef.current = pos
      editorViewRef.current.dispatch({
        effects: setLockedHighlight.of(pos)
      })
      // Scroll to locked element
      editorViewRef.current.dispatch({
        effects: EditorView.scrollIntoView(pos.from, { y: 'center' })
      })
    }
    
    // Update UI state LAST to avoid re-render clearing styles
    setLockedElement(target.tagName.toLowerCase())
  }, [findElementPosition, getElementColor, mixColorWithBackground, darkBg, findElementInCode])

  const clearLock = useCallback(() => {
    // Restore locked element's original styles
    if (lockedSvgElementRef.current) {
      const el = lockedSvgElementRef.current
      el.setAttribute('stroke', el.dataset.originalStroke === 'none' ? '' : el.dataset.originalStroke || '')
      el.setAttribute('stroke-width', el.dataset.originalStrokeWidth || '')
      if (el.dataset.originalFill) {
        el.setAttribute('fill', el.dataset.originalFill === 'none' ? '' : el.dataset.originalFill)
      }
      el.style.paintOrder = ''
      lockedSvgElementRef.current = null
    }
    setLockedElement(null)
    lockedLineRef.current = null
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: setLockedHighlight.of({ from: -1, to: -1 })
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    // If locked, don't clear anything
    if (lockedSvgElementRef.current) {
      return
    }
    
    // Only clear hover highlight if not the locked element
    if (currentHoveredRef.current) {
      const el = currentHoveredRef.current
      el.setAttribute('stroke', el.dataset.originalStroke === 'none' ? '' : el.dataset.originalStroke || '')
      el.setAttribute('stroke-width', el.dataset.originalStrokeWidth || '')
      if (el.dataset.originalFill) {
        el.setAttribute('fill', el.dataset.originalFill === 'none' ? '' : el.dataset.originalFill)
      }
      el.style.paintOrder = ''
    }
    currentHoveredRef.current = null
    setHoveredElement(null)
    
    // Clear hover highlight but keep locked highlight
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: setHighlight.of({ from: -1, to: -1 })
      })
    }
  }, [])

  useEffect(() => {
    const container = svgContainerRef.current
    if (!container) return

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('click', handleClick)
    }
  }, [svgCode, handleMouseMove, handleMouseLeave, handleClick])

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800/50 px-8 py-5 flex items-center gap-4 h-16">
        <h1 className="text-white text-lg font-semibold tracking-tight">
          SEEVG – SVG Inspector
        </h1>
        {hoveredElement && (
          <Tag closeable={false} kind="accent" variant="solid">
            <span>&lt;{hoveredElement}&gt;</span>
          </Tag>
        )}
        {lockedElement && (
          <Tag closeable={false} kind="positive" variant="solid">
            <span>🔒 &lt;{lockedElement}&gt;</span>
          </Tag>
        )}
        <a
          href="https://github.com/REPO_PLACEHOLDER"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-slate-400 hover:text-white transition-colors"
          title="View on GitHub"
        >
          <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-0">
        {/* Preview Panel */}
        <div className="w-full sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-slate-800/50 min-h-[40vh] sm:min-h-0">
          <div className="px-8 py-3 border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between h-16">
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Preview</span>
            <div className="flex items-center gap-2">
              {/* Lock control */}
              {lockedElement && (
                <button
                  onClick={clearLock}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 h-8 transition-colors"
                  title="Clear lock"
                >
                  Clear lock
                </button>
              )}
              {/* Background toggle */}
              <button
                onClick={() => setDarkBg(!darkBg)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  darkBg 
                    ? 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 h-8' 
                    : 'bg-white text-slate-900 hover:bg-slate-200 h-8'
                }`}
                title="Toggle background"
              >
                {darkBg ? '◐ Dark' : '◑ Light'}
              </button>
              {/* Zoom controls */}
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 h-8">
                <button
                  onClick={zoomOut}
                  className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                  title="Zoom out"
                >
                  −
                </button>
                <button
                  onClick={resetZoom}
                  className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-xs min-w-[48px]"
                  title="Reset zoom"
                >
                  {zoom}%
                </button>
                <button
                  onClick={zoomIn}
                  className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                  title="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div 
            className={`relative flex-1 flex items-center justify-center p-12 overflow-auto transition-colors duration-200 ${
              darkBg 
                ? 'bg-grid-dark' 
                : 'bg-grid-light'
            }`}
          >
            <span className={`absolute top-4 right-4 text-xs ${darkBg ? 'text-slate-300' : 'text-slate-700'}`}>
              Click on a node to lock it on the code editor
            </span>
            <div 
              ref={svgContainerRef}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
              dangerouslySetInnerHTML={svgHtml}
            />
          </div>
        </div>

        {/* Editor Panel */}
        <div className="w-full sm:w-1/2 flex flex-col bg-slate-950 flex-1 sm:flex-initial sm:min-h-0">
          <div className="flex flex-row items-center justify-start px-8 py-3 border-b border-slate-800/50 bg-slate-900/30 h-16">
            <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Code</span>
          </div>
          <div ref={editorRef} className="flex-1 overflow-auto min-h-0" />
        </div>
      </div>
    </div>
  )
}

export default App
