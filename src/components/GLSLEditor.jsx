import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './GLSLEditor.css';

const defaultShader = `precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;
uniform vec2 u_mouse;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    
    // Sample texture
    vec4 texColor = texture2D(u_texture, uv);
    
    // Add some animation
    float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
    
    // Mix texture with effect
    vec3 color = texColor.rgb * wave;
    
    gl_FragColor = vec4(color, 1.0);
}`;

export default function GLSLEditor({ onCompile }) {
    const [code, setCode] = useState(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('glsl-shader');
        return saved || defaultShader;
    });
    const [error, setError] = useState(null);
    const [saveStatus, setSaveStatus] = useState(''); // 'saving' or 'saved'
    const [showConfirm, setShowConfirm] = useState(false);
    const editorRef = useRef(null);
    const decorationsRef = useRef([]);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
        handleCompile();
    };

    const handleShaderError = (errorInfo) => {
        setError(errorInfo.message);

        // Highlight error line in editor
        if (errorInfo.lineNumber && editorRef.current) {
            const editor = editorRef.current;
            const decorations = editor.deltaDecorations(decorationsRef.current, [
                {
                    range: {
                        startLineNumber: errorInfo.lineNumber,
                        startColumn: 1,
                        endLineNumber: errorInfo.lineNumber,
                        endColumn: 1000
                    },
                    options: {
                        isWholeLine: true,
                        className: 'error-line',
                        glyphMarginClassName: 'error-glyph',
                        hoverMessage: { value: `**Error:** ${errorInfo.message}` }
                    }
                }
            ]);
            decorationsRef.current = decorations;
        }
    };

    const handleCompile = () => {
        setError(null);

        // Clear previous error decorations
        if (editorRef.current) {
            const editor = editorRef.current;
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
        }

        try {
            onCompile(code, handleShaderError);
            // Auto-save on compile
            localStorage.setItem('glsl-shader', code);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(''), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleExport = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shader.glsl';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleNew = () => {
        setShowConfirm(true);
    };

    const confirmNew = () => {
        setCode(defaultShader);
        setError(null);
        setShowConfirm(false);
    };

    const cancelNew = () => {
        setShowConfirm(false);
    };

    const handleEditorChange = (value) => {
        setCode(value || '');
        setError(null);
        setSaveStatus('');
    };

    return (
        <div className="glsl-editor">
            <div className="editor-header">
                <h2 className="editor-title">
                    <span className="icon">⚡</span>
                    GLSL Shader Editor
                </h2>
                <div className="editor-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleNew}
                        title="Create new shader from template"
                    >
                        <span className="icon">📄</span>
                        New
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleExport}
                        title="Export shader as .glsl file"
                    >
                        <span className="icon">📥</span>
                        Export
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCompile}
                        title="Compile and auto-save"
                    >
                        <span className="icon">▶</span>
                        Compile
                        {saveStatus === 'saved' && <span className="save-indicator">✓</span>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="editor-container">
                <Editor
                    height="100%"
                    defaultLanguage="glsl"
                    theme="vs-dark"
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        wordWrap: 'on',
                        padding: { top: 16, bottom: 16 },
                        glyphMargin: true,
                    }}
                />
            </div>

            {showConfirm && (
                <div className="modal-overlay" onClick={cancelNew}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Create New Shader?</h3>
                        <p className="modal-message">
                            Current changes will be lost if not compiled.
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelNew}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={confirmNew}>
                                Create New
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
