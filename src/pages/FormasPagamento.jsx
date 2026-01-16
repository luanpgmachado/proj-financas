import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import {
  getBaseUrl,
  getOpenApiDocument,
  getOperation,
  getRequestSchema,
  getResponseSchema,
  resolveSchema
} from "../utils/openapi";

function buildFieldConfig(schema, doc) {
  const resolved = resolveSchema(schema, doc);
  if (!resolved || resolved.type !== "object") {
    return [];
  }

  const required = new Set(resolved.required || []);

  return Object.entries(resolved.properties || {}).map(([name, definition]) => {
    const fieldSchema = resolveSchema(definition, doc) || definition;
    const type = fieldSchema?.type || "string";
    const format = fieldSchema?.format;
    const optionsList = fieldSchema?.enum || null;

    return {
      name,
      label: name,
      type,
      format,
      options: optionsList,
      required: required.has(name),
      isJson: type === "object" || type === "array"
    };
  });
}

function resolveColumns(schema, doc) {
  const resolved = resolveSchema(schema, doc);
  if (!resolved) {
    return [];
  }
  if (resolved.type === "array") {
    const itemSchema = resolveSchema(resolved.items, doc);
    return Object.keys(itemSchema?.properties || {});
  }
  if (resolved.type === "object") {
    return Object.keys(resolved.properties || {});
  }
  return [];
}

function formatValidationErrors(errorData) {
  const detail = errorData?.detail;
  if (!Array.isArray(detail)) {
    return [];
  }

  return detail
    .map((item) => {
      const loc = Array.isArray(item.loc)
        ? item.loc.join(".")
        : typeof item.loc === "string"
        ? item.loc
        : "";
      const cleanedLoc = loc.replace(/^body\./, "");
      const message = item.msg || "Erro de validacao.";
      return cleanedLoc ? `${cleanedLoc}: ${message}` : message;
    })
    .filter(Boolean);
}

export default function FormasPagamento() {
  const doc = useMemo(() => getOpenApiDocument(), []);
  const baseUrl = useMemo(() => getBaseUrl(doc), [doc]);
  const baseUrlConfigured = Boolean(baseUrl);

  const listReady = useMemo(
    () => Boolean(getOperation(doc, "/formas-pagamento", "get")),
    [doc]
  );
  const createReady = useMemo(
    () => Boolean(getOperation(doc, "/formas-pagamento", "post")),
    [doc]
  );
  const updateReady = useMemo(
    () => Boolean(getOperation(doc, "/formas-pagamento/{forma_pagamento_id}", "put")),
    [doc]
  );
  const deleteReady = useMemo(
    () => Boolean(getOperation(doc, "/formas-pagamento/{forma_pagamento_id}", "delete")),
    [doc]
  );

  const requestSchema = useMemo(
    () => getRequestSchema(doc, "/formas-pagamento", "post"),
    [doc]
  );
  const responseSchema = useMemo(
    () => getResponseSchema(doc, "/formas-pagamento", "get"),
    [doc]
  );
  const fields = useMemo(() => buildFieldConfig(requestSchema, doc), [requestSchema, doc]);
  const schemaColumns = useMemo(
    () => resolveColumns(responseSchema, doc),
    [responseSchema, doc]
  );

  const [rows, setRows] = useState([]);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [editingId, setEditingId] = useState("");
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    if (fields.length === 0) {
      setFormValues({});
      return;
    }
    setFormValues((prev) => {
      const next = {};
      fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(prev, field.name)) {
          next[field.name] = prev[field.name];
          return;
        }
        next[field.name] = field.type === "boolean" ? false : "";
      });
      return next;
    });
  }, [fields]);

  useEffect(() => {
    if (!baseUrlConfigured || !listReady) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setFetchError("");
      setRawResponse(null);
      try {
        const data = await apiRequest(baseUrl, "/formas-pagamento", { method: "GET" });
        if (Array.isArray(data)) {
          setRows(data);
          setRawResponse(null);
          return;
        }
        if (Array.isArray(data?.items)) {
          setRows(data.items);
          setRawResponse(null);
          return;
        }
        setRows([]);
        setRawResponse(data || null);
      } catch (error) {
        setFetchError("Nao foi possivel carregar as formas de pagamento.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [baseUrlConfigured, listReady, baseUrl, refreshIndex]);

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (forma) => {
    setEditingId(forma.id || "");
    setSubmitError("");
    setSubmitSuccess("");
    setValidationErrors([]);
    setFormValues((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field.name] = forma[field.name] ?? "";
      });
      return next;
    });
  };

  const handleCancel = () => {
    setEditingId("");
    setSubmitError("");
    setSubmitSuccess("");
    setValidationErrors([]);
    setFormValues((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        next[field.name] = "";
      });
      return next;
    });
  };

  const handleDelete = async (formaId) => {
    if (!baseUrlConfigured || !deleteReady) {
      return;
    }
    setSubmitError("");
    setSubmitSuccess("");
    try {
      await apiRequest(baseUrl, `/formas-pagamento/${formaId}`, { method: "DELETE" });
      setSubmitSuccess("Forma de pagamento removida com sucesso.");
      setRefreshIndex((prev) => prev + 1);
    } catch (error) {
      const detail = error?.data?.detail;
      setSubmitError(detail || "Nao foi possivel remover a forma de pagamento.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setValidationErrors([]);

    if (!baseUrlConfigured) {
      setSubmitError("VITE_API_BASE_URL nao configurada no front-end.");
      return;
    }

    if (!createReady && !updateReady) {
      setSubmitError("Endpoints de formas de pagamento nao definidos no OpenAPI.");
      return;
    }

    const isEditing = Boolean(editingId);
    if (isEditing && !updateReady) {
      setSubmitError("Endpoint PUT /formas-pagamento/{forma_pagamento_id} nao definido.");
      return;
    }
    if (!isEditing && !createReady) {
      setSubmitError("Endpoint POST /formas-pagamento nao definido no OpenAPI.");
      return;
    }

    const payload = {};
    try {
      fields.forEach((field) => {
        const rawValue = formValues[field.name];
        if (rawValue === "" || rawValue === undefined) {
          return;
        }
        if (field.isJson) {
          payload[field.name] = JSON.parse(rawValue);
          return;
        }
        if (field.type === "number" || field.type === "integer") {
          payload[field.name] = Number(rawValue);
          return;
        }
        if (field.type === "boolean") {
          payload[field.name] = Boolean(rawValue);
          return;
        }
        payload[field.name] = rawValue;
      });
    } catch (error) {
      setSubmitError("JSON invalido em um dos campos.");
      return;
    }

    try {
      const endpoint = isEditing
        ? `/formas-pagamento/${editingId}`
        : "/formas-pagamento";
      const method = isEditing ? "PUT" : "POST";
      await apiRequest(baseUrl, endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      setSubmitSuccess(isEditing ? "Forma atualizada." : "Forma de pagamento criada.");
      setRefreshIndex((prev) => prev + 1);
      if (isEditing) {
        setEditingId("");
      }
      setFormValues((prev) => {
        const next = { ...prev };
        fields.forEach((field) => {
          next[field.name] = "";
        });
        return next;
      });
    } catch (error) {
      if (error?.status === 422) {
        const errors = formatValidationErrors(error?.data);
        setValidationErrors(errors);
        setSubmitError("Erro de validacao retornado pela API.");
        return;
      }
      const detail = error?.data?.detail;
      setSubmitError(detail || "Nao foi possivel salvar a forma de pagamento.");
    }
  };

  const columns = schemaColumns.length
    ? schemaColumns
    : Object.keys(rows[0] || {});

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Formas de pagamento
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Formas cadastradas</h1>
        <p className="mt-2 text-base text-ink-soft">
          CRUD integrado a API V2, sem logica de negocio no front-end.
        </p>
      </div>

      {!baseUrlConfigured && (
        <div className="surface border border-rose-200 bg-rose-50/80 p-6 text-sm text-ink-soft">
          Defina a variavel <strong>VITE_API_BASE_URL</strong> para conectar o
          front-end ao backend (ex: <strong>http://localhost:8000</strong>) e
          reinicie o servidor do Vite.
        </div>
      )}

      {!listReady && (
        <div className="surface border border-amber-200 bg-amber-50/80 p-6 text-sm text-ink-soft">
          Endpoint GET /formas-pagamento nao definido no OpenAPI.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Listagem</h2>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink-soft">
              {baseUrl || "VITE_API_BASE_URL nao configurada"}
            </span>
          </div>

          {baseUrlConfigured && listReady && loading && (
            <p className="mt-4 text-sm text-ink-soft">Carregando...</p>
          )}
          {baseUrlConfigured && listReady && fetchError && (
            <p className="mt-4 text-sm text-rose-600">{fetchError}</p>
          )}

          {baseUrlConfigured && listReady && !loading && !fetchError && rows.length === 0 && (
            <p className="mt-4 text-sm text-ink-soft">Nenhuma forma exibida.</p>
          )}

          {baseUrlConfigured && listReady && rawResponse && (
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink/5 p-4 text-xs text-ink">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          )}

          {baseUrlConfigured && listReady && rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-ink-soft">
                    {columns.map((column) => (
                      <th key={column} className="px-3 py-2 font-semibold">
                        {column}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      {columns.map((column) => (
                        <td key={column} className="px-3 py-3 text-ink">
                          {typeof row[column] === "object"
                            ? JSON.stringify(row[column])
                            : String(row[column] ?? "-")}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink-soft transition hover:border-ink/40 hover:text-ink"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                            disabled={!deleteReady}
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="surface p-6">
          <h2 className="section-title">
            {editingId ? "Editar forma de pagamento" : "Nova forma de pagamento"}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Campos gerados a partir do contrato OpenAPI.
          </p>

          {!createReady && !updateReady && (
            <p className="mt-4 text-sm text-ink-soft">
              Endpoints de formas de pagamento nao definidos no OpenAPI.
            </p>
          )}

          {baseUrlConfigured && (createReady || updateReady) && fields.length > 0 && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-semibold text-ink">
                    {field.label}
                  </label>
                  {field.options && (
                    <select
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                      value={formValues[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      required={field.required}
                    >
                      <option value="">Selecione</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                  {!field.options && field.isJson && (
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                      value={formValues[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      placeholder="JSON conforme o schema"
                      required={field.required}
                    />
                  )}
                  {!field.options && !field.isJson && (
                    <input
                      type={
                        field.format === "date"
                          ? "date"
                          : field.format === "date-time"
                          ? "datetime-local"
                          : field.type === "number" || field.type === "integer"
                          ? "number"
                          : "text"
                      }
                      className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                      value={formValues[field.name]}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      required={field.required}
                    />
                  )}
                </div>
              ))}

              {submitError && (
                <p className="text-sm font-semibold text-rose-600">{submitError}</p>
              )}
              {validationErrors.length > 0 && (
                <ul className="space-y-1 text-xs text-rose-600">
                  {validationErrors.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
              {submitSuccess && (
                <p className="text-sm font-semibold text-emerald-600">{submitSuccess}</p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                  disabled={!baseUrlConfigured}
                >
                  {editingId ? "Salvar alteracoes" : "Criar forma de pagamento"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-ink/30 hover:text-ink"
                  >
                    Cancelar edicao
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
