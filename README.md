# ⚡ InstantGLSL

A real-time GLSL shader editor and preview application built with React and WebGL. Write, compile, and visualize fragment shaders instantly with support for image and video textures.

![InstantGLSL Application](file:///Users/lenguyenkhoa/.gemini/antigravity/brain/127f072f-b399-4301-bd51-7a10d99cf766/app_screenshot.png)

## ✨ Features

- **Real-time GLSL Editor** - Monaco-based code editor with syntax highlighting and error detection
- **Live Shader Preview** - Instant WebGL rendering with automatic recompilation
- **Media Input Support** - Upload and apply shaders to images and videos
- **Interactive Controls** - Mouse tracking, time-based animations, and resolution uniforms
- **Error Handling** - Clear error messages with line numbers for debugging
- **Responsive Design** - Optimized layout for desktop, tablet, and mobile devices
- **Modern UI** - Clean, professional interface with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd InstantGLSL
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/`

## 📖 Usage

### Writing Shaders

The editor comes with a default shader that demonstrates basic functionality. Your fragment shader has access to these uniforms:

- `uniform vec2 u_resolution` - Canvas resolution in pixels
- `uniform float u_time` - Time in seconds since start
- `uniform sampler2D u_texture` - Media texture (image or video)
- `uniform vec2 u_mouse` - Mouse position (normalized 0-1)

### Example Shader

```glsl
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_texture;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec4 texColor = texture2D(u_texture, uv);
    
    // Add wave animation
    float wave = sin(uv.x * 10.0 + u_time) * 0.5 + 0.5;
    vec3 color = texColor.rgb * wave;
    
    gl_FragColor = vec4(color, 1.0);
}
```

### Adding Media

1. Click the **"Click to upload"** area in the preview section
2. Select an image or video file
3. The shader will automatically apply to your media
4. Use the **Remove** button to clear the media

### Compiling Shaders

- Click the **Compile** button or press `Cmd/Ctrl + Enter` in the editor
- Errors will be displayed inline in the editor and in the preview section
- The preview updates automatically on successful compilation

## 🛠️ Built With

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor (same as VS Code)
- **WebGL** - GPU-accelerated shader rendering
- **ESLint** - Code linting

## 📁 Project Structure

```
InstantGLSL/
├── src/
│   ├── components/
│   │   ├── GLSLEditor.jsx      # Monaco-based shader editor
│   │   ├── GLSLEditor.css
│   │   ├── ShaderPreview.jsx   # WebGL canvas and rendering
│   │   ├── ShaderPreview.css
│   │   ├── MediaInput.jsx      # File upload component
│   │   └── MediaInput.css
│   ├── App.jsx                 # Main application component
│   ├── App.css
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles
├── public/                     # Static assets
├── index.html                 # HTML template
├── package.json
└── vite.config.js
```

## 🎨 Shader Uniforms Reference

| Uniform | Type | Description |
|---------|------|-------------|
| `u_resolution` | `vec2` | Canvas width and height in pixels |
| `u_time` | `float` | Elapsed time in seconds |
| `u_texture` | `sampler2D` | Uploaded image or video texture |
| `u_mouse` | `vec2` | Mouse position (x, y) normalized to 0-1 |

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The optimized build will be created in the `dist/` directory.

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 💡 Tips

- Use `gl_FragCoord.xy / u_resolution` to get normalized UV coordinates
- The `u_time` uniform is perfect for creating animations
- Press and hold on the preview to pause shader execution
- Experiment with different blend modes and color manipulations
- Check the browser console for WebGL errors if shaders don't compile

## 🔗 Resources

- [GLSL Reference](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
- [The Book of Shaders](https://thebookofshaders.com/)
- [Shadertoy](https://www.shadertoy.com/) - Shader examples and inspiration
- [WebGL Fundamentals](https://webglfundamentals.org/)
