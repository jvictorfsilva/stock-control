import React, { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  SelectItem,
  InlineNotification,
} from "@carbon/react";
import PropTypes from "prop-types";

import Cookies from "js-cookie";
import api from "../../services/api";

const EditItemModal = ({
  open,
  onClose,
  itemId,
  onSuccess,
  showNotification,
  setNotificationKind,
  setNotificationTitle,
  setNotificationSubtitle,
}) => {
  const [formValues, setFormValues] = useState({
    name: "",
    quantity: 0,
    price: 0,
    category: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!open || !itemId) return;

    async function loadData() {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        const [itemRes, catsRes] = await Promise.all([
          api.get(`/items/${itemId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/categories/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setFormValues({
          name: itemRes.data.name,
          quantity: itemRes.data.quantity,
          price: itemRes.data.price,
          category: itemRes.data.category_id,
        });
        setCategories(catsRes.data);
      } catch (err) {
        showNotification(true);
        setNotificationKind("error");
        setNotificationTitle("Erro ao carregar dados");
        setNotificationSubtitle(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [open, itemId]);

  const handleChange = (field) => (e) => {
    const value = e.target?.value;
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };
  const handleSelectChange = (e) => {
    setFormValues((prev) => ({ ...prev, category: Number(e.target.value) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const token = Cookies.get("userToken");
      if (!token) throw new Error("Authentication token not found in cookies.");
      const { data } = await api.put(
        `/items/${itemId}`,
        {
          name: formValues.name,
          quantity: formValues.quantity,
          price: formValues.price,
          category: formValues.category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(data);
      setNotificationKind("success");
      setNotificationTitle("Item Updated");
      setNotificationSubtitle(`Item "${data.name}" updated successfully`);
      showNotification(true);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to edit item.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading={`Edit Item #${itemId}`}
      primaryButtonText={loading ? "Saving..." : "Save"}
      secondaryButtonText="Cancel"
      preventCloseOnClickOutside
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      onSecondarySubmit={onClose}
    >
      <div style={{ marginBottom: "1rem" }}>
        <TextInput
          id="edit-name"
          labelText="Name"
          value={formValues.name}
          onChange={handleChange("name")}
        />
        <NumberInput
          id="edit-quantity"
          label="Quantity"
          value={formValues.quantity}
          allowEmpty
          min={0}
          onChange={(_, { value }) =>
            setFormValues((prev) => ({
              ...prev,
              quantity: value === "" ? "" : Number(value),
            }))
          }
        />
        <NumberInput
          id="edit-price"
          label="Price"
          value={formValues.price}
          allowEmpty
          min={0}
          step={0.1}
          onChange={(_, { value }) =>
            setFormValues((prev) => ({
              ...prev,
              price: value === "" ? "" : Number(value),
            }))
          }
        />
        <Select
          id="edit-category"
          labelText="Category"
          value={formValues.category}
          onChange={handleSelectChange}
        >
          <SelectItem key="" value="" text="Select category" />
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} text={cat.name} />
          ))}
        </Select>
        {error && (
          <InlineNotification
            kind="error"
            title="Add Item Failed"
            subtitle={error}
            lowContrast
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>
    </Modal>
  );
};
EditItemModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  setNotificationKind: PropTypes.func.isRequired,
  setNotificationTitle: PropTypes.func.isRequired,
  setNotificationSubtitle: PropTypes.func.isRequired,
};

export default EditItemModal;
