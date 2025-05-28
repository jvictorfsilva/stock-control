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
import DeleteCategoryModal from "./Categories/DeleteCategoryModal";
import AddCategoryModal from "./Categories/AddCategoryModal";
import EditCategoryModal from "./Categories/EditCategoryModal";

const formatDate = (unixTs = Math.floor(Date.now()) / 1000) => {
  const date = new Date(unixTs * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};
const formatCurrentDateTime = () => {
  const now = new Date();
  const hours24 = now.getHours();
  const hours12 = String(hours24 % 12 || 12).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = hours24 >= 12 ? "PM" : "AM";

  return `${hours12}:${minutes}:${seconds} ${ampm}`;
};

const CategoryTable = () => {
  const [initialRows, setInitialRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [inputPageValue, setInputPageValue] = useState("1");
  const pageInputDebounceTimeoutRef = useRef(null);

  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationKind, setNotificationKind] = useState("success");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationSubtitle, setNotificationSubtitle] = useState("");

  const [fetchError, setFetchError] = useState("");

  const headers = [
    { key: "id", header: "ID" },
    { key: "name", header: "Category Name" },
    { key: "item_count", header: "Item Amount" },
    { key: "created_on", header: "Created On" },
    { key: "updated_on", header: "Updated On" },
  ];

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/categories/");
      const formattedData = data.map((cat) => ({
        id: cat.id.toString(),
        name: cat.name,
        item_count: cat.item_count.toString(),
        created_on: formatDate(cat.created_on),
        updated_on: formatDate(cat.updated_on),
      }));
      setInitialRows(formattedData);
      setFilteredRows(formattedData);
      setFetchError("");
    } catch (err) {
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Could not load categories list."
      );
      setNotificationKind("error");
      setNotificationTitle("Error Loading Categories");
      setNotificationSubtitle(
        "Could not load the categories list. Please try again later."
      );
      setShowNotification(true);
    }
  };

  useEffect(() => {
    fetchCategories();
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

  const handleEditClick = (id) => {
    setCategoryToEdit(id);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (rowId) => {
    const cat = initialRows.find((cat) => cat.id === rowId);
    if (cat) {
      setCategoryToDelete(cat);
      setIsDangerModalOpen(true);
      setDeleteError(null);
    } else {
      setNotificationKind("error");
      setNotificationTitle("Error");
      setNotificationSubtitle("Selected category not found.");
      setShowNotification(true);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const userToken = Cookies.get("userToken");
      if (!userToken) {
        throw new Error("Authentication token not found in cookies.");
      }
      await api.delete(`/categories/${categoryToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      setInitialRows((prevRows) =>
        prevRows.filter((row) => row.id !== categoryToDelete.id)
      );
      setFilteredRows((prevRows) =>
        prevRows.filter((row) => row.id !== categoryToDelete.id)
      );
      setNotificationKind("success");
      setNotificationTitle("Category Deleted");
      setNotificationSubtitle(
        `The category "${categoryToDelete.name}" was deleted successfully.`
      );
      setShowNotification(true);
      setIsDangerModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete Category.";
      setDeleteError(message);
      setNotificationKind("error");
      setNotificationTitle("Failed to Delete Category");
      setNotificationSubtitle(message);
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

  const onAddSuccess = () => {
    window.location.reload(true);
  };
  const onEditSuccess = () => {
    window.location.reload(true);
  };

  return (
    <>
      <DataTable
        rows={filteredRows.slice((page - 1) * pageSize, page * pageSize)}
        headers={headers}
      >
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
          getTableContainerProps,
        }) => (
          <TableContainer title="Categories List" {...getTableContainerProps()}>
            <TableToolbar>
              <TableToolbarContent
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <TableToolbarSearch
                  labelText="Search categories"
                  placeholder="Search categories..."
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
                      Rows per page:
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
                <Button
                  renderIcon={Add}
                  iconDescription="Add Category"
                  onClick={() => setIsAddOpen(true)}
                >
                  Add Category
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
                          onClick={() => handleEditClick(row.id)}
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

      {categoryToDelete && (
        <DeleteCategoryModal
          isOpen={isDangerModalOpen}
          onClose={() => setIsDangerModalOpen(false)}
          onConfirm={confirmDelete}
          modalHeading={`Delete category "${categoryToDelete.name}"?`}
          modalBody={`This action cannot be undone. All data associated with "${categoryToDelete.name}" will be permanently removed. Please confirm you wish to proceed.`}
          confirmButtonText={deleteLoading ? "Deleting..." : "Delete"}
          cancelButtonText="Cancel"
          confirmationTextRequired="delete"
          loading={deleteLoading}
          error={deleteError}
        />
      )}
      <AddCategoryModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={onAddSuccess}
        showNotification={setShowNotification}
        setNotificationKind={setNotificationKind}
        setNotificationTitle={setNotificationTitle}
        setNotificationSubtitle={setNotificationSubtitle}
      />

      <EditCategoryModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        categoryId={categoryToEdit}
        itemId={categoryToEdit}
        onSuccess={onEditSuccess}
        showNotification={setShowNotification}
        setNotificationKind={setNotificationKind}
        setNotificationTitle={setNotificationTitle}
        setNotificationSubtitle={setNotificationSubtitle}
      />
    </>
  );
};

export default CategoryTable;
