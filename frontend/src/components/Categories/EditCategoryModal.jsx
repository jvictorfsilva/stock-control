import React, { useEffect, useState } from "react";
import { Modal, TextInput, InlineNotification } from "@carbon/react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import api from "../../services/api";

const EditCategoryModal = ({
  open,
  onClose,
  categoryId,
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
    if (!open || !categoryId) return;

    async function loadCategory() {
      setLoading(true);
      try {
        const token = Cookies.get("userToken");
        if (!token)
          throw new Error("Authentication token not found in cookies.");
        const { data } = await api.get(`/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(data.name);
      } catch (err) {
        showNotification(true);
        setNotificationKind("error");
        setNotificationTitle("Error Loading Category");
        setNotificationSubtitle(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCategory();
  }, [open, categoryId]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("userToken");
      if (!token) throw new Error("Authentication token not found in cookies.");
      const { data } = await api.put(
        `/categories/${categoryId}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(data);
      setNotificationKind("success");
      setNotificationTitle("Category Updated");
      setNotificationSubtitle(`Category "${data.name}" updated successfully.`);
      showNotification(true);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to update category.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading={
        categoryId ? `Edit Category #${categoryId}` : "Edit Category"
      }
      primaryButtonText={loading ? "Saving..." : "Save"}
      secondaryButtonText="Cancel"
      preventCloseOnClickOutside
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      onSecondarySubmit={onClose}
    >
      <div style={{ marginBottom: "1rem" }}>
        <TextInput
          id="edit-category-name"
          labelText="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        {error && (
          <InlineNotification
            kind="error"
            title="Edit Category Failed"
            subtitle={error}
            lowContrast
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>
    </Modal>
  );
};

EditCategoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSuccess: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  setNotificationKind: PropTypes.func.isRequired,
  setNotificationTitle: PropTypes.func.isRequired,
  setNotificationSubtitle: PropTypes.func.isRequired,
};

export default EditCategoryModal;
