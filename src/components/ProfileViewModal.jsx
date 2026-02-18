import "../chat/chatpage.css";

function ProfileViewModal({ user, onClose }) {
  if (!user) {
    return null;
  }

  const isOnline = Boolean(user.onlineStatus);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal profile-view-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span className="profile-view-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="presentation">
                <path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z" />
                <path d="M4.5 20.2a7.5 7.5 0 0 1 15 0" />
              </svg>
            </span>
            User Profile
          </h3>
          <button className="icon-btn profile-modal-close" onClick={onClose} aria-label="Close profile">
            <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="modal-body profile-view-modal-body">
          <div className="profile-view-identity">
            <div
              className="profile-view-avatar"
              style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : undefined}
              aria-label={`${user.username || "User"} profile avatar`}
            >
              {!user.avatarUrl && (
                <span className="profile-view-avatar-fallback">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>

            <h2 className="profile-view-name">{user.username || "Unknown User"}</h2>
            <p className={`profile-view-status ${isOnline ? "online" : "offline"}`}>
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>

          <div className="profile-view-fields">
            <div className="profile-view-field">
              <span className="profile-view-field-label">Bio</span>
              <p className="profile-view-field-value">{user.bio || "No bio added yet"}</p>
            </div>

            <div className="profile-view-field">
              <span className="profile-view-field-label">Phone Number</span>
              <p className="profile-view-field-value">{user.phoneNumber || "Not provided"}</p>
            </div>

            <div className="profile-view-field">
              <span className="profile-view-field-label">Email</span>
              <p className="profile-view-field-value">{user.email || "Not provided"}</p>
            </div>
          </div>

          <button className="primary-btn profile-view-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileViewModal;
