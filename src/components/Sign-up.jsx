import { useState } from "react";
import axios from "axios";

function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const signupUrl = `${apiBaseUrl}/api/users/sign-up`;

  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (data.username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (!data.email.includes("@")) {
      setError("Invalid email");
      setLoading(false);
      return;
    }

    if (data.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (data.password !== data.confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        signupUrl,
        {
          username: data.username.trim(),
          name: data.username.trim(),
          email: data.email.trim(),
          password: data.password,
        },
        { timeout: 8000 },
      );

      if (onSignupSuccess) {
        onSignupSuccess();
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const statusCode = err.response?.status;

      if (serverMessage) {
        setError(`${serverMessage} (status ${statusCode || "unknown"})`);
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. Check whether the backend is running.");
      } else if (err.message === "Network Error") {
        setError("Network error. Check backend URL, CORS, and server status.");
      } else if (err.message) {
        setError(`${err.message} (status ${statusCode || "network"})`);
      } else {
        setError("Sign-up failed. Check the backend and network.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            placeholder="Choose a username"
            value={data.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            value={data.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="********"
            value={data.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            name="confirm"
            placeholder="********"
            value={data.confirm}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? <span className="spinner"></span> : null}
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="auth-switch">
          {"Already have an account? "}
          <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

export default Signup;
