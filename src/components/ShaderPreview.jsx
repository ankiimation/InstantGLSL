import { useRef, useEffect, useState } from 'react';
import './ShaderPreview.css';

export default function ShaderPreview({ shaderCode, mediaSource, onError, onMediaRemove }) {
    const canvasRef = useRef(null);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showOriginal, setShowOriginal] = useState(false);
    const glRef = useRef(null);
    const programRef = useRef(null);
    const textureRef = useRef(null);
    const animationRef = useRef(null);
    const startTimeRef = useRef(Date.now());
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            setError('WebGL not supported');
            return;
        }
        glRef.current = gl;

        // Handle mouse movement
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: rect.height - (e.clientY - rect.top)
            };
        };
        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!mediaSource || !glRef.current) return;

        const gl = glRef.current;
        let videoUpdateFrameId = null; // Track the video update loop

        const loadTexture = (source) => {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            // Flip Y-axis to match standard image coordinates
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            // Set texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            if (source instanceof HTMLImageElement) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            } else if (source instanceof HTMLVideoElement) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            }

            return texture;
        };

        const updateVideoTexture = (texture, video) => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // Ensure Y-axis flip is still set
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        };

        const resizeCanvasToMedia = (width, height) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const container = canvas.parentElement;
            const maxWidth = container.clientWidth;
            const maxHeight = container.clientHeight;

            // Calculate aspect ratio
            const mediaAspect = width / height;
            const containerAspect = maxWidth / maxHeight;

            let newWidth, newHeight;
            if (mediaAspect > containerAspect) {
                // Media is wider than container
                newWidth = maxWidth;
                newHeight = maxWidth / mediaAspect;
            } else {
                // Media is taller than container
                newHeight = maxHeight;
                newWidth = maxHeight * mediaAspect;
            }

            canvas.width = newWidth;
            canvas.height = newHeight;
            canvas.style.width = `${newWidth}px`;
            canvas.style.height = `${newHeight}px`;

            // Update viewport
            gl.viewport(0, 0, newWidth, newHeight);
        };

        if (mediaSource.type === 'image') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const texture = loadTexture(img);
                textureRef.current = texture;
                resizeCanvasToMedia(img.width, img.height);
            };
            img.src = mediaSource.url;
        } else if (mediaSource.type === 'video') {
            const video = document.createElement('video');
            video.src = mediaSource.url;
            video.loop = true;
            video.muted = true;
            video.play();

            video.addEventListener('loadeddata', () => {
                const texture = loadTexture(video);
                textureRef.current = texture;
                resizeCanvasToMedia(video.videoWidth, video.videoHeight);

                const updateFrame = () => {
                    if (video.readyState >= video.HAVE_CURRENT_DATA) {
                        updateVideoTexture(texture, video);
                    }
                    videoUpdateFrameId = requestAnimationFrame(updateFrame);
                };
                updateFrame();
            });
        }

        return () => {
            // Cancel the video update loop
            if (videoUpdateFrameId) {
                cancelAnimationFrame(videoUpdateFrameId);
            }
            
            if (textureRef.current) {
                gl.deleteTexture(textureRef.current);
                textureRef.current = null;
            }
        };
    }, [mediaSource]);

    useEffect(() => {
        if (!shaderCode || !glRef.current) return;

        const gl = glRef.current;
        setError(null);

        try {
            // Vertex shader
            const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertexShader, vertexShaderSource);
            gl.compileShader(vertexShader);

            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                throw new Error('Vertex shader error: ' + gl.getShaderInfoLog(vertexShader));
            }

            // Fragment shader
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragmentShader, shaderCode);
            gl.compileShader(fragmentShader);

            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                const errorLog = gl.getShaderInfoLog(fragmentShader);

                // Parse error to extract line number
                // WebGL errors typically look like: "ERROR: 0:5: 'invalid' : syntax error"
                const lineMatch = errorLog.match(/ERROR: \d+:(\d+):/);
                const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;

                const error = new Error(errorLog);
                error.lineNumber = lineNumber;
                throw error;
            }

            // Create program
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
            }

            // Clean up old program
            if (programRef.current) {
                gl.deleteProgram(programRef.current);
            }
            programRef.current = program;

            // Set up geometry
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, -1,
                1, -1,
                -1, 1,
                1, 1,
            ]), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(positionLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            // Start render loop
            const render = () => {
                if (!isPlaying) return;

                const canvas = canvasRef.current;
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);

                gl.useProgram(program);

                // Set uniforms
                const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
                if (resolutionLocation) {
                    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
                }

                const timeLocation = gl.getUniformLocation(program, 'u_time');
                if (timeLocation) {
                    gl.uniform1f(timeLocation, (Date.now() - startTimeRef.current) / 1000);
                }

                const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
                if (mouseLocation) {
                    gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
                }

                const textureLocation = gl.getUniformLocation(program, 'u_texture');
                if (textureLocation && textureRef.current) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
                    gl.uniform1i(textureLocation, 0);
                }

                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

                animationRef.current = requestAnimationFrame(render);
            };

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            render();

        } catch (err) {
            setError(err.message);
            // Pass error details to parent if callback provided
            if (onError) {
                onError({
                    message: err.message,
                    lineNumber: err.lineNumber
                });
            }
        }
    }, [shaderCode, isPlaying, onError, mediaSource]);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
        if (!isPlaying) {
            startTimeRef.current = Date.now();
        }
    };

    const handlePreviewMouseDown = () => {
        setShowOriginal(true);
    };

    const handlePreviewMouseUp = () => {
        setShowOriginal(false);
    };

    const handleRemoveMedia = () => {
        if (onMediaRemove) {
            onMediaRemove();
        }
    };

    return (
        <div className="shader-preview">
            <div className="preview-header">
                <h2 className="preview-title">
                    <span className="icon">🎨</span>
                    Shader Preview
                </h2>

                {/* Media controls in header (shown when media is loaded) */}
                {mediaSource && (
                    <div className="header-controls">
                        <button
                            className="control-btn preview-btn"
                            onMouseDown={handlePreviewMouseDown}
                            onMouseUp={handlePreviewMouseUp}
                            onMouseLeave={handlePreviewMouseUp}
                            title="Hold to show original"
                        >
                            {showOriginal ? '👁️ Original' : '🎨 Preview'}
                        </button>
                        <button
                            className="control-btn pause-btn"
                            onClick={togglePlayPause}
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button
                            className="control-btn remove-btn"
                            onClick={handleRemoveMedia}
                            title="Remove media"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-banner">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            <div className="canvas-container">
                <canvas ref={canvasRef} className="preview-canvas" />

                {/* Original media overlay (shown when holding preview button) */}
                {mediaSource && showOriginal && (
                    <div className="original-overlay">
                        {mediaSource.type === 'image' ? (
                            <img src={mediaSource.url} alt="Original" className="original-media" />
                        ) : (
                            <video
                                src={mediaSource.url}
                                className="original-media"
                                autoPlay
                                loop
                                muted
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}