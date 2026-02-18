import { useEffect, useState } from "react";
import axios from "axios";
import "./FriendRequests.css";

function FriendRequests({ currentUserId, onRequestStatusChange }) {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("received"); // "received" or "sent"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all requests (received and sent)
  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const followInfoRes = await axios.get(
        `http://localhost:5000/api/users/${currentUserId}/follow-info`
      );

      setReceivedRequests(followInfoRes.data.receivedRequests || []);
      setSentRequests(followInfoRes.data.sentRequests || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch requests on mount and periodically
  useEffect(() => {
    if (currentUserId) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  // Accept request
  const handleAccept = async (requesterId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/users/${currentUserId}/accept-follow/${requesterId}`
      );
      setReceivedRequests(receivedRequests.filter(r => r._id !== requesterId));
      onRequestStatusChange?.();
      alert("✓ Follow request accepted!");
    } catch (err) {
      console.error("Error accepting request:", err);
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  // Reject request
  const handleReject = async (requesterId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/users/${currentUserId}/reject-follow/${requesterId}`
      );
      setReceivedRequests(receivedRequests.filter(r => r._id !== requesterId));
      alert("✗ Follow request rejected");
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  // Cancel sent request
  const handleCancelRequest = async (targetUserId) => {
    try {
      // Reject as if it's a received request from that user
      await axios.post(
        `http://localhost:5000/api/users/${targetUserId}/reject-follow/${currentUserId}`
      );
      setSentRequests(sentRequests.filter(u => u._id !== targetUserId));
      onRequestStatusChange?.();
      alert("✓ Follow request cancelled");
    } catch (err) {
      console.error("Error cancelling request:", err);
      alert(err.response?.data?.message || "Failed to cancel request");
    }
  };

  return (
    <div className="friend-requests-container">
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          📬 Received ({receivedRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          📤 Sent ({sentRequests.length})
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : activeTab === "received" ? (
        <div className="requests-list">
          {receivedRequests.length === 0 ? (
            <div className="empty-state">
              <p>📭 No pending follow requests</p>
              <small>When someone sends you a follow request, it will appear here</small>
            </div>
          ) : (
            receivedRequests.map((requester) => (
              <div key={requester._id} className="request-item received">
                <div className="requester-info">
                  <span className={`status ${requester.onlineStatus ? "online" : "offline"}`}></span>
                  <div className="user-details">
                    <span className="username">{requester.username}</span>
                    <span className="email">{requester.email}</span>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleAccept(requester._id)}
                    title="Accept follow request"
                  >
                    ✓
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(requester._id)}
                    title="Reject follow request"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="requests-list">
          {sentRequests.length === 0 ? (
            <div className="empty-state">
              <p>📨 No pending sent requests</p>
              <small>Your follow requests will appear here until the recipient responds</small>
            </div>
          ) : (
            sentRequests.map((recipient) => (
              <div key={recipient._id} className="request-item sent">
                <div className="requester-info">
                  <span className={`status ${recipient.onlineStatus ? "online" : "offline"}`}></span>
                  <div className="user-details">
                    <span className="username">{recipient.username}</span>
                    <span className="email">{recipient.email}</span>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancelRequest(recipient._id)}
                    title="Cancel follow request"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default FriendRequests;
