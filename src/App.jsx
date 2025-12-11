import { useState, useEffect } from 'react';
import GLSLEditor from './components/GLSLEditor';
import ShaderPreview from './components/ShaderPreview';
import MediaInput from './components/MediaInput';
import './App.css';

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

function App() {
  const [shaderCode, setShaderCode] = useState(defaultShader);
  const [compiledShader, setCompiledShader] = useState(defaultShader);
  const [mediaSource, setMediaSource] = useState(null);
  const [errorCallback, setErrorCallback] = useState(null);

  // Load default sample image on mount
  useEffect(() => {
    const loadDefaultMedia = async () => {
      try {
        // Use BASE_URL to work in both dev and production
        const response = await fetch(`${import.meta.env.BASE_URL}/public/sample.webp`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setMediaSource({ type: 'image', url });
      } catch (error) {
        console.error('Failed to load default media:', error);
      }
    };
    loadDefaultMedia();
  }, []);

  const handleCompile = (code, onError) => {
    setCompiledShader(code);
    // Store error callback to pass to ShaderPreview
    setErrorCallback(() => onError);
  };

  const handleMediaSelect = (media) => {
    setMediaSource(media);
  };

  const handleMediaRemove = () => {
    setMediaSource(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="logo">⚡</span>
            InstantGLSL
          </h1>
          <p className="app-subtitle">Real-time GLSL Shader Editor & Preview</p>
        </div>
      </header>

      <main className="app-main">
        <div className="editor-section">
          <GLSLEditor
            onCompile={handleCompile}
          />
        </div>

        <div className="preview-section">
          <ShaderPreview
            shaderCode={compiledShader}
            mediaSource={mediaSource}
            onError={errorCallback}
            onMediaRemove={handleMediaRemove}
          />

          {!mediaSource && (
            <div className="media-wrapper">
              <MediaInput onMediaSelect={handleMediaSelect} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
