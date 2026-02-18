import { useRef, useState } from "react";
import axios from "axios";
import PhotoCropper from "./PhotoCropper";
import "../chat/chatpage.css";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function ProfileEditModal({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    phoneNumber: user.phoneNumber || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const fileInputRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }

    event.target.value = null;
  }

  function handleCropComplete(croppedImageBlob) {
    setFormData((previous) => ({ ...previous, avatarUrl: croppedImageBlob }));
    setShowCropper(false);
    setTempImageSrc(null);
  }

  function handleRemovePhoto() {
    setFormData((previous) => ({ ...previous, avatarUrl: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/${user._id}/update`, formData);
      onUpdate(response.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {showCropper && tempImageSrc ? (
        <PhotoCropper
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setTempImageSrc(null);
          }}
        />
      ) : (
        <div className="modal profile-edit-modal" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Profile</h3>
            <button
              className="icon-btn profile-modal-close"
              onClick={onClose}
              aria-label="Close edit profile modal"
            >
              <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="modal-body profile-edit-modal-body">
            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="profile-edit-avatar-block">
                <button
                  type="button"
                  className="profile-edit-avatar"
                  onClick={() => fileInputRef.current?.click()}
                  style={formData.avatarUrl ? { backgroundImage: `url(${formData.avatarUrl})` } : undefined}
                  aria-label="Change profile photo"
                >
                  {!formData.avatarUrl && (
                    <span className="profile-edit-avatar-fallback">
                      {formData.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                  <span className="profile-edit-avatar-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" role="presentation">
                      <path d="M4.5 7.5h3l1.1-1.8h6.8l1.1 1.8h3A1.5 1.5 0 0 1 21 9v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17V9a1.5 1.5 0 0 1 1.5-1.5z" />
                      <circle cx="12" cy="13" r="3.2" />
                    </svg>
                  </span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="profile-edit-file-input"
                  accept="image/*"
                />

                <div className="profile-edit-avatar-actions">
                  <button
                    type="button"
                    className="profile-avatar-action"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </button>
                  {formData.avatarUrl && (
                    <button
                      type="button"
                      className="profile-avatar-action profile-avatar-remove"
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group profile-edit-field">
                <label htmlFor="edit-username">Username</label>
                <input
                  id="edit-username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="text-input"
                  required
                />
              </div>

              <div className="form-group profile-edit-field">
                <label htmlFor="edit-phone-number">Phone Number</label>
                <input
                  id="edit-phone-number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="text-input"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="form-group profile-edit-field">
                <label htmlFor="edit-bio">Bio</label>
                <input
                  id="edit-bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="text-input"
                  placeholder="Tell us about yourself"
                />
              </div>

              <button type="submit" className="primary-btn profile-edit-submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileEditModal;
