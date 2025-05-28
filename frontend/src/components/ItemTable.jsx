import React, { useState, useEffect, useRef } from "react";
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  OverflowMenu,
  OverflowMenuItem,
  ToastNotification,
} from "@carbon/react";
import { Add, Settings, ChevronLeft, ChevronRight } from "@carbon/icons-react";
import Cookies from "js-cookie";
import api from "../services/api";
import DeleteModal from "./DeleteModal";

const formatDate = (unixTs) => {
  const date = new Date(unixTs * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const ItemTable = () => {
  const [initialRows, setInitialRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [inputPageValue, setInputPageValue] = useState("1");
  const pageInputDebounceTimeoutRef = useRef(null);

  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationKind, setNotificationKind] = useState("success");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationSubtitle, setNotificationSubtitle] = useState("");

  const headers = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "quantity", header: "Quantity" },
    { key: "price", header: "Price" },
    { key: "created_on", header: "Created On" },
    { key: "updated_on", header: "Updated On" },
  ];

  const fetchItems = async () => {
    try {
      const { data } = await api.get("/items/");
      const formattedData = data.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        created_on: formatDate(item.created_on),
        updated_on: formatDate(item.updated_on),
      }));
      setInitialRows(formattedData);
      setFilteredRows(formattedData);
    } catch (e) {
      console.error("Error fetching items", e);
      setNotificationKind("error");
      setNotificationTitle("Error Loading Items");
      setNotificationSubtitle(
        "Could not load the items list. Please try again later."
      );
      setShowNotification(true);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    return () => {
      if (pageInputDebounceTimeoutRef.current) {
        clearTimeout(pageInputDebounceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setInputPageValue(String(page));
  }, [page]);

  useEffect(() => {
    const maxPage = Math.ceil(filteredRows.length / pageSize) || 1;
    if (page > maxPage) setPage(maxPage);
  }, [filteredRows, pageSize, page]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setPage(1);
    setInputPageValue("1");

    if (value) {
      const lower = value.toLowerCase();
      const newFiltered = initialRows.filter((row) =>
        Object.values(row).some((cell) =>
          String(cell).toLowerCase().includes(lower)
        )
      );
      setFilteredRows(newFiltered);
    } else {
      setFilteredRows(initialRows);
    }
  };

  const handleEdit = (id) => {
    console.log(`Edit item ${id}`);
  };

  const handleDeleteClick = (rowId) => {
    const item = initialRows.find((item) => item.id === rowId);
    if (item) {
      setItemToDelete(item);
      setIsDangerModalOpen(true);
      setDeleteError(null);
    } else {
      console.error(`Item with ID ${rowId} not found for deletion.`);
      setNotificationKind("error");
      setNotificationTitle("Error");
      setNotificationSubtitle("Selected item not found.");
      setShowNotification(true);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const userToken = Cookies.get("userToken");

      if (!userToken) {
        throw new Error("Authentication token not found in cookies.");
      }

      await api.delete(`/items/${itemToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      setInitialRows((prevRows) =>
        prevRows.filter((row) => row.id !== itemToDelete.id)
      );
      setFilteredRows((prevRows) =>
        prevRows.filter((row) => row.id !== itemToDelete.id)
      );

      setNotificationKind("success");
      setNotificationTitle("Item Deleted");
      setNotificationSubtitle(
        `The item "${itemToDelete.name}" was deleted successfully.`
      );
      setShowNotification(true);

      setIsDangerModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item", error);
      let errorMessage = "An error occurred while deleting the item.";
      if (error.response && error.response.data && error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setDeleteError(errorMessage);
      setNotificationKind("error");
      setNotificationTitle("Failed to Delete Item");
      setNotificationSubtitle(errorMessage);
      setShowNotification(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const displayRows = filteredRows.slice(start, end);
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const handlePageInputChange = (e) => {
    const rawValue = e.target.value;
    setInputPageValue(rawValue);

    if (pageInputDebounceTimeoutRef.current) {
      clearTimeout(pageInputDebounceTimeoutRef.current);
    }

    pageInputDebounceTimeoutRef.current = setTimeout(() => {
      let numericValue = Number(rawValue);

      if (isNaN(numericValue) || numericValue < 1) {
        numericValue = 1;
      }
      if (numericValue > totalPages) {
        numericValue = totalPages;
      }
      setPage(numericValue);
    }, 500);
  };

  return (
    <>
      <DataTable rows={displayRows} headers={headers} isSortable>
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
          getTableContainerProps,
        }) => (
          <TableContainer title="Items List" {...getTableContainerProps()}>
            <TableToolbar>
              <TableToolbarContent
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <TableToolbarSearch
                  labelText="Search items"
                  placeholder="Search items..."
                  value={searchValue}
                  onChange={handleSearchChange}
                />

                <OverflowMenu
                  icon={Settings}
                  flipped
                  label="Settings"
                  renderIcon={Settings}
                  menuOffset={{ top: 15, left: 0 }}
                >
                  <div style={{ padding: "0.5rem 1rem" }}>
                    <label htmlFor="pageSize" style={{ marginRight: "0.5rem" }}>
                      Items per page:
                    </label>
                    <input
                      id="pageSize"
                      type="number"
                      min={1}
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                        setInputPageValue("1");
                      }}
                      style={{ width: "4rem", marginTop: "0.5rem" }}
                    />
                  </div>
                </OverflowMenu>

                <Button renderIcon={Add} iconDescription="Add Item">
                  Add Item
                </Button>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      key={header.key}
                      {...getHeaderProps({ header })}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} {...getRowProps({ row })}>
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                    <TableCell>
                      <OverflowMenu flipped>
                        <OverflowMenuItem
                          itemText="Edit"
                          onClick={() => handleEdit(row.id)}
                        />
                        <OverflowMenuItem
                          itemText="Delete"
                          onClick={() => handleDeleteClick(row.id)}
                          className="delete-button"
                        />
                      </OverflowMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Button
                renderIcon={ChevronLeft}
                disabled={page <= 1}
                hasIconOnly
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                iconDescription="Previous page"
                size="sm"
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  fontSize: "16px",
                }}
              >
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={inputPageValue}
                  onChange={handlePageInputChange}
                  onBlur={() => {
                    let numericValue = Number(inputPageValue);
                    if (isNaN(numericValue) || numericValue < 1) {
                      numericValue = 1;
                    }
                    if (numericValue > totalPages) {
                      numericValue = totalPages;
                    }
                    setPage(numericValue);
                    if (pageInputDebounceTimeoutRef.current) {
                      clearTimeout(pageInputDebounceTimeoutRef.current);
                    }
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    textAlign: "center",
                    margin: "0",
                    fontSize: "16px",
                    border: "0",
                    padding: "0",
                    lineHeight: "32px",
                  }}
                />
                <span
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "16px",
                    lineHeight: "32px",
                    width: "16px",
                    height: "32px",
                  }}
                >
                  /
                </span>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "0",
                    fontSize: "16px",
                    lineHeight: "32px",
                    width: "32px",
                    height: "32px",
                  }}
                >
                  {totalPages}
                </span>
              </div>

              <Button
                renderIcon={ChevronRight}
                disabled={page >= totalPages}
                hasIconOnly
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                iconDescription="Next page"
                size="sm"
              />
            </div>
          </TableContainer>
        )}
      </DataTable>

      {itemToDelete && (
        <DeleteModal
          isOpen={isDangerModalOpen}
          onClose={() => setIsDangerModalOpen(false)}
          onConfirm={confirmDeleteItem}
          modalHeading={`Delete item "${itemToDelete.name}"?`}
          modalBody={`This action cannot be undone. All data associated with "${itemToDelete.name}" will be permanently removed. Please confirm you wish to proceed.`}
          confirmButtonText={deleteLoading ? "Deleting..." : "Delete"}
          cancelButtonText="Cancel"
          confirmationTextRequired="delete"
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      {showNotification && (
        <ToastNotification
          kind={notificationKind}
          title={notificationTitle}
          subtitle={notificationSubtitle}
          caption=""
          timeout={5000}
          onCloseButtonClick={() => setShowNotification(false)}
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            zIndex: 9999,
          }}
        />
      )}
    </>
  );
};

export default ItemTable;
