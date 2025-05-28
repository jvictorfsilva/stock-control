import React, { useState, useEffect } from "react";
import { Modal, TextInput, InlineNotification } from "@carbon/react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import api from "../../services/api";

const AddCategoryModal = ({
  open,
  onClose,
  onSuccess,
  showNotification,
  setNotificationKind,
  setNotificationTitle,
  setNotificationSubtitle,
}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setName("");
    }
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("userToken");
      if (!token) throw new Error("Authentication token not found in cookies.");
      const { data } = await api.post(
        "/categories/",
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(data);
      setNotificationKind("success");
      setNotificationTitle("Category Added");
      setNotificationSubtitle(`Category "${data.name}" added successfully.`);
      showNotification(true);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to add category.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading="Add New Category"
      primaryButtonText={loading ? "Adding..." : "Add"}
      secondaryButtonText="Cancel"
      preventCloseOnClickOutside
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      onSecondarySubmit={onClose}
    >
      <div style={{ marginBottom: "1rem" }}>
        <TextInput
          id="add-category-name"
          labelText="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && (
          <InlineNotification
            kind="error"
            title="Add Category Failed"
            subtitle={error}
            lowContrast
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>
    </Modal>
  );
};

AddCategoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  setNotificationKind: PropTypes.func.isRequired,
  setNotificationTitle: PropTypes.func.isRequired,
  setNotificationSubtitle: PropTypes.func.isRequired,
};

export default AddCategoryModal;
