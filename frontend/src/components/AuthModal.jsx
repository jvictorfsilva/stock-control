import React, { useState, useCallback } from "react";
import { Modal, TextInput, InlineNotification } from "@carbon/react";
import Cookies from "js-cookie";
import auth from "../services/auth";

const AuthModal = ({ open, onClose }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetFormAndMessages = useCallback(() => {
    setForm({ username: "", email: "", password: "" });
    setError("");
    setSuccess("");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleMode = useCallback(() => {
    setMode((prevMode) => (prevMode === "login" ? "register" : "login"));
    resetFormAndMessages();
  }, [resetFormAndMessages]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint = mode === "login" ? "/login" : "/register";
    const payload =
      mode === "login"
        ? { email: form.email, password: form.password }
        : {
            username: form.username,
            email: form.email,
            password: form.password,
          };

    try {
      const response = await auth.post(endpoint, payload);
      const userToken = response.data.token;
      Cookies.set("userToken", userToken, { expires: 7 });
      setSuccess(
        mode === "login" ? "Login successful!" : "Registration successful!"
      );
      setTimeout(() => {
        onClose();
        resetFormAndMessages();
      }, 1000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "An error occurred. Please try again later.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formContainerStyle = { width: "70%", margin: "0 auto" };

  return (
    <Modal
      open={open}
      size="sm"
      onRequestClose={() => {
        onClose();
        resetFormAndMessages();
        setMode("login");
      }}
      modalHeading={mode === "login" ? "Log in" : "Create your account"}
      secondaryButtonText="Cancel"
      primaryButtonText={mode === "login" ? "Log In" : "Register"}
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={loading}
    >
      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          lowContrast
          style={{ marginBottom: "1rem" }}
        />
      )}
      {success && (
        <InlineNotification
          kind="success"
          title="Success"
          subtitle={success}
          lowContrast
          style={{ marginBottom: "1rem" }}
        />
      )}

      {mode === "login" ? (
        <div style={formContainerStyle}>
          <div style={{ marginBottom: "1rem" }}>
            <TextInput
              id="email-login"
              name="email"
              labelText="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <TextInput
              id="password-login"
              name="password"
              labelText="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", lineHeight: "1.25rem" }}>
              Don't have an account yet?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleMode();
                }}
                style={{
                  color: "#0f62fe",
                  fontWeight: "600",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Sign up!
              </a>
            </p>
          </div>
        </div>
      ) : (
        <div style={formContainerStyle}>
          <div style={{ marginBottom: "1rem" }}>
            <TextInput
              id="username-register"
              name="username"
              labelText="Username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <TextInput
              id="email-register"
              name="email"
              labelText="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <TextInput
              id="password-register"
              name="password"
              labelText="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
          </div>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", lineHeight: "1.25rem" }}>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleMode();
                }}
                style={{
                  color: "#0f62fe",
                  fontWeight: "600",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Log in!
              </a>
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AuthModal;
