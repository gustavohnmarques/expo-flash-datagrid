import type { PrismTheme } from 'prism-react-renderer';

export const codeTheme: PrismTheme = {
  plain: {
    color: '#d8e4f6',
    backgroundColor: '#0c182c',
  },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#8195b5', fontStyle: 'italic' } },
    { types: ['punctuation', 'operator'], style: { color: '#a3b5d1' } },
    { types: ['keyword', 'builtin', 'important', 'atrule'], style: { color: '#7fb4ff' } },
    { types: ['tag'], style: { color: '#7fb4ff' } },
    { types: ['function', 'method'], style: { color: '#a9d0ff' } },
    { types: ['class-name', 'maybe-class-name'], style: { color: '#9ee0e8' } },
    { types: ['attr-name', 'property'], style: { color: '#c3d4f5' } },
    { types: ['string', 'char', 'attr-value', 'inserted'], style: { color: '#a6e3c5' } },
    { types: ['number', 'boolean', 'constant'], style: { color: '#f4cd8c' } },
    { types: ['deleted'], style: { color: '#ff9b9b' } },
    { types: ['variable', 'imports'], style: { color: '#d8e4f6' } },
  ],
};
