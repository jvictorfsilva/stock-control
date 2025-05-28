import React, { useState, useEffect } from "react";
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

const AddItemModal = ({
  open,
  onClose,
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
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (open) {
      api
        .get("/categories/")
        .then(({ data }) => setCategories(data))
        .catch((err) => console.error("Failed to load categories", err));
      setError("");
      setFormValues({ name: "", quantity: 0, price: 0, category: 0 });
    }
  }, [open]);

  const handleChange = (field) => (e) => {
    const value = field === "name" ? e.target.value : Number(e.target.value);
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
      const { data } = await api.post(
        "/items/",
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
      setNotificationTitle("Item Added");
      setNotificationSubtitle(
        `Item "${data.name}" added in category "${data.category_name}" successfully.`
      );
      showNotification(true);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.detail || err.message || "Failed to add item.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading="Add New Item"
      primaryButtonText={loading ? "Adding..." : "Add"}
      secondaryButtonText="Cancel"
      preventCloseOnClickOutside
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      onSecondarySubmit={onClose}
    >
      <div style={{ marginBottom: "1rem" }}>
        <TextInput
          id="add-name"
          labelText="Name"
          value={formValues.name}
          onChange={handleChange("name")}
        />
        <NumberInput
          id="add-quantity"
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
          id="add-price"
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
          id="add-category"
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

AddItemModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  setNotificationKind: PropTypes.func.isRequired,
  setNotificationTitle: PropTypes.func.isRequired,
  setNotificationSubtitle: PropTypes.func.isRequired,
};

export default AddItemModal;
