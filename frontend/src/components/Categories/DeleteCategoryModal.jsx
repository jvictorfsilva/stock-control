import React, { useState, useEffect } from "react";
import { Modal, Button, TextInput, InlineNotification } from "@carbon/react";

const DeleteCategoryModal = ({
  isOpen,
  onClose,
  onConfirm,
  modalHeading,
  modalBody,
  confirmButtonText,
  cancelButtonText,
  confirmationTextRequired,
  loading = false,
  error = null,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [showInputError, setShowInputError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmInput("");
      setShowInputError(false);
    }
  }, [isOpen]);

  const handleConfirmAction = () => {
    if (confirmationTextRequired) {
      if (confirmInput === confirmationTextRequired) {
        onConfirm();
        setShowInputError(false);
      } else {
        setShowInputError(true);
      }
    } else {
      onConfirm();
    }
  };

  const isConfirmButtonDisabled =
    confirmationTextRequired && confirmInput !== confirmationTextRequired;

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading={modalHeading}
      primaryButtonText={confirmButtonText}
      secondaryButtonText={cancelButtonText}
      danger
      preventCloseOnClickOutside
      onRequestSubmit={handleConfirmAction}
    >
      <p style={{ marginBottom: "1rem" }}>{modalBody}</p>

      {error && (
        <InlineNotification
          kind="error"
          title="Operation Error"
          subtitle={error}
          lowContrast
          style={{ marginBottom: "1rem" }}
        />
      )}

      {showInputError && (
        <InlineNotification
          kind="error"
          title="Confirmation Required"
          subtitle={`Please type '${confirmationTextRequired}' to confirm.`}
          lowContrast
          style={{ marginBottom: "1rem" }}
        />
      )}

      {confirmationTextRequired && (
        <TextInput
          id="confirm-action-input"
          labelText={`To confirm, type '${confirmationTextRequired}' below:`}
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isConfirmButtonDisabled) {
              handleConfirmAction();
            }
          }}
        />
      )}
    </Modal>
  );
};
export default DeleteCategoryModal;
