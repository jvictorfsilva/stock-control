import React, { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Select,
  SelectItem,
  InlineNotification,
} from "@carbon/react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import auth from "../services/auth";

const AdminModal = ({
  open,
  onClose,
  onSuccess,
  showNotification,
  setNotificationKind,
  setNotificationTitle,
  setNotificationSubtitle,
}) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("user");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = Cookies.get("userToken");
      if (!token) throw new Error("Authentication token not found in cookies.");
      await auth.post(
        "/change-role",
        { email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotificationKind("success");
      setNotificationTitle("Role Updated");
      setNotificationSubtitle(`Role of '${email}' changed to '${role}'.`);
      showNotification(true);
      onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "Failed to change role.";
      setError(msg);
      setNotificationKind("error");
      setNotificationTitle("Change Role Failed");
      setNotificationSubtitle(msg);
      showNotification(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading="Change User Role"
      primaryButtonText={loading ? "Saving..." : "Save"}
      secondaryButtonText="Cancel"
      preventCloseOnClickOutside
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
      onRequestSubmit={handleSubmit}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <TextInput
          id="change-role-email"
          labelText="User Email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Select
          id="change-role-select"
          labelText="Select Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
        >
          <SelectItem text="User" value="user" />
          <SelectItem text="Admin" value="admin" />
        </Select>

        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            lowContrast
          />
        )}
      </div>
    </Modal>
  );
};

AdminModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  setNotificationKind: PropTypes.func.isRequired,
  setNotificationTitle: PropTypes.func.isRequired,
  setNotificationSubtitle: PropTypes.func.isRequired,
};

export default AdminModal;
