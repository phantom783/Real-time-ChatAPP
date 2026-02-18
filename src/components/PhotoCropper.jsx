import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/canvasUtils';
import '../chat/chatpage.css'; // Reuse styles

const PhotoCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    }, [imageSrc, croppedAreaPixels, onCropComplete]);

    return (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="modal" style={{ width: '90%', maxWidth: '500px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3>Adjust Photo</h3>
                    <button className="icon-btn" onClick={onCancel}>✕</button>
                </div>

                <div className="modal-body" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: 0 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '60px', background: '#333' }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={onCropChange}
                            onCropComplete={onCropCompleteHandler}
                            onZoomChange={onZoomChange}
                            showGrid={false}
                            cropShape="round"
                        />
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-color)',
                        padding: '0 20px',
                        borderTop: '1px solid var(--sidebar-border)'
                    }}>
                        <span style={{ marginRight: '10px', fontSize: '0.9rem' }}>Zoom:</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="zoom-range"
                            style={{ flex: 1 }}
                        />
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="text-btn" onClick={onCancel}>Cancel</button>
                    <button className="primary-btn" onClick={showCroppedImage}>Save Photo</button>
                </div>
            </div>
        </div>
    );
};

export default PhotoCropper;
