import './MediaInput.css';

export default function MediaInput({ onMediaSelect }) {
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' : 'video';

        onMediaSelect({ type, url, name: file.name });
    };

    const handleUrlInput = (url, type) => {
        onMediaSelect({ type, url, name: url });
    };

    return (
        <div className="media-input">
            <div className="media-header">
                <h3 className="media-title">
                    <span className="icon">🖼️</span>
                    Media Input
                </h3>
            </div>

            <div className="upload-area">
                <label className="upload-label">
                    <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="file-input"
                    />
                    <div className="upload-content">
                        <span className="upload-icon">📁</span>
                        <span className="upload-text">Click to upload</span>
                        <span className="upload-hint">Image or Video</span>
                    </div>
                </label>

                <div className="divider">
                    <span>or</span>
                </div>

                <div className="quick-select">
                    <button
                        className="quick-btn"
                        onClick={() => handleUrlInput('https://picsum.photos/800/600', 'image')}
                    >
                        <span className="icon">🎲</span>
                        Random Image
                    </button>
                    <button
                        className="quick-btn"
                        onClick={() => handleUrlInput('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'video')}
                    >
                        <span className="icon">🎬</span>
                        Sample Video
                    </button>
                </div>
            </div>
        </div>
    );
}
