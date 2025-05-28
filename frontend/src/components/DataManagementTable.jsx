import React, { useState, useEffect } from "react";
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
} from "@carbon/react";

export default function DataManagementTable({
  entityName,
  fetchEndpoint,
  columns,
  renderAddForm,
  renderEditForm,
  idKey = "id",
}) {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalConfig, setModalConfig] = useState({ type: null, data: null });

  const fetchData = async () => {
    const res = await fetch(fetchEndpoint);
    const data = await res.json();
    setRows(data.map((item) => ({ ...item, key: String(item[idKey]) })));
  };

  useEffect(() => {
    fetchData();
  }, [fetchEndpoint]);

  const filtered = rows.filter((r) =>
    columns.some((col) =>
      String(r[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <TableContainer title={entityName}>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch
              persistent={false}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar"
            />
            <Button onClick={() => setModalConfig({ type: "add", data: null })}>
              Adicionar {entityName.slice(0, -1)}
            </Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableHeader key={col.key}>{col.header}</TableHeader>
              ))}
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.key}>
                {columns.map((col) => (
                  <TableCell key={col.key}>{r[col.key]}</TableCell>
                ))}
                <TableCell>
                  <OverflowMenu size="sm">
                    <OverflowMenuItem
                      itemText="Editar"
                      onClick={() => setModalConfig({ type: "edit", data: r })}
                    />
                    <OverflowMenuItem
                      itemText="Excluir"
                      onClick={() =>
                        setModalConfig({ type: "delete", data: r })
                      }
                    />
                  </OverflowMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {modalConfig.type === "add" &&
        renderAddForm({
          onClose: () => setModalConfig({ type: null, data: null }),
          onSuccess: fetchData,
        })}

      {modalConfig.type === "edit" &&
        renderEditForm({
          data: modalConfig.data,
          onClose: () => setModalConfig({ type: null, data: null }),
          onSuccess: fetchData,
        })}
    </>
  );
}
