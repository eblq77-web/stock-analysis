#!/usr/bin/env node
// Super Brain V3 Minifier - aggressive version

const fs = require('fs');

const input = 'SUPER_BRAIN_APP_V3.html';
const output = 'SUPER_BRAIN_APP_V3.min.html';

let html = fs.readFileSync(input, 'utf8');
const originalSize = Buffer.byteLength(html, 'utf8');

console.log(`📦 Minifying: ${input} (${(originalSize/1024).toFixed(1)} KB)`);

// ========== 1. Remove HTML comments ==========
html = html.replace(/<!--[\s\S]*?-->/g, '');

// ========== 2. Minify <style> block ==========
html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
    css = css.replace(/\/\*[\s\S]*?\*\//g, ''); // remove CSS comments
    css = css.replace(/\s+/g, ' '); // collapse whitespace
    css = css.replace(/\s*([{}:;,])\s*/g, '$1'); // remove space around tokens
    css = css.replace(/([{;])\s+/g, '$1'); // leading space after {;
    css = css.replace(/\s+([{}])/g, '$1'); // leading space before {}
    css = css.replace(/;}/g, '}'); // trailing ; before }
    css = css.trim();
    return `<style>${css}</style>`;
});

// ========== 3. Minify <script> blocks ==========
// First pass: remove string literals so we don't accidentally minify them
const strings = [];
let stringIdx = 0;

html = html.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, open, js, close) => {
    let code = js;
    
    // Protect string literals with placeholders
    code = code.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g, (str) => {
        const placeholder = `__STR_${stringIdx}__`;
        strings.push(str);
        stringIdx++;
        return placeholder;
    });
    
    // Remove all comments FIRST (after protecting strings)
    code = code.replace(/\/\*[\s\S]*?\*\//g, ''); // block comments
    code = code.replace(/\/\/.*$/gm, ''); // line comments
    
    // Collapse whitespace
    code = code.replace(/[\t ]+/g, ' '); // tabs/spaces to single space
    code = code.replace(/\s*([{}()[\],;=<>!&|^~?:+-\/%])\s*/g, '$1'); // around operators
    code = code.replace(/;\s*}/g, '}'); // trailing ; before }
    code = code.replace(/\s*{\s*/g, '{'); // { surrounding space
    code = code.replace(/\s*}\s*/g, '}'); // } surrounding space
    code = code.replace(/\s*,\s*/g, ','); // , surrounding space
    code = code.replace(/\s*;\s*/g, ';'); // ; surrounding space
    code = code.replace(/\s+/g, ' '); // collapse remaining spaces
    
    // Restore string literals
    strings.forEach((str, i) => {
        code = code.replace(`__STR_${i}__`, str);
    });
    
    code = code.trim();
    return open + code + close;
});

// ========== 4. Remove inter-tag whitespace ==========
html = html.replace(/>\s+</g, '><');

// ========== 5. Collapse multiple newlines in text ==========
html = html.replace(/\n{3,}/g, '\n\n');

// ========== 6. Trim ==========
html = html.trim();

const minifiedSize = Buffer.byteLength(html, 'utf8');
const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

console.log(`   Minified: ${(minifiedSize / 1024).toFixed(1)} KB`);
console.log(`   Saved: ${savings}%`);

fs.writeFileSync(output, html);
console.log(`✅ Saved: ${output}`);
