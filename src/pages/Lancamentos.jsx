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
    const options = fieldSchema?.enum || null;

    return {
      name,
      label: name,
      type,
      format,
      options,
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

export default function Lancamentos() {
  const doc = useMemo(() => getOpenApiDocument(), []);
  const baseUrl = useMemo(() => getBaseUrl(doc), [doc]);
  const baseUrlConfigured = Boolean(baseUrl);
  const requestSchema = useMemo(
    () => getRequestSchema(doc, "/lancamentos", "post"),
    [doc]
  );
  const responseSchema = useMemo(
    () => getResponseSchema(doc, "/lancamentos", "get"),
    [doc]
  );
  const listReady = useMemo(
    () => Boolean(getOperation(doc, "/lancamentos", "get")),
    [doc]
  );
  const createReady = useMemo(
    () => Boolean(getOperation(doc, "/lancamentos", "post")),
    [doc]
  );
  const canList = baseUrlConfigured && listReady;
  const canCreate = baseUrlConfigured && createReady;
  const missingInfo = useMemo(() => {
    if (listReady && createReady) {
      return null;
    }
    if (!listReady && !createReady) {
      return {
        endpoints: "GET /lancamentos e POST /lancamentos",
        hint: "a listagem e o formulario serao habilitados automaticamente."
      };
    }
    if (!listReady) {
      return {
        endpoints: "GET /lancamentos",
        hint: "a listagem sera habilitada automaticamente."
      };
    }
    return {
      endpoints: "POST /lancamentos",
      hint: "o formulario sera habilitado automaticamente."
    };
  }, [listReady, createReady]);
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
  const [formValues, setFormValues] = useState({});
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const initial = {};
    fields.forEach((field) => {
      initial[field.name] = field.type === "boolean" ? false : "";
    });
    setFormValues(initial);
  }, [fields]);

  useEffect(() => {
    if (!canList) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setFetchError("");
      setRawResponse(null);
      try {
        const data = await apiRequest(baseUrl, "/lancamentos", {
          method: "GET"
        });

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
        setFetchError("Nao foi possivel carregar os lancamentos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [baseUrl, canList, refreshIndex]);

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!baseUrlConfigured) {
      setSubmitError("VITE_API_BASE_URL nao configurada no front-end.");
      return;
    }

    if (!createReady) {
      setSubmitError("Endpoint POST /lancamentos nao definido no OpenAPI.");
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
      await apiRequest(baseUrl, "/lancamentos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setSubmitSuccess("Lancamento criado com sucesso.");
      setSubmitError("");
      setRefreshIndex((prev) => prev + 1);
    } catch (error) {
      setSubmitError("Nao foi possivel criar o lancamento.");
      setSubmitSuccess("");
    }
  };

  const columns = schemaColumns.length
    ? schemaColumns
    : Object.keys(rows[0] || {});

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Lancamentos
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Lancamentos financeiros</h1>
        <p className="mt-2 text-base text-ink-soft">
          Integracao via OpenAPI. Sem regras de negocio no front-end.
        </p>
      </div>

      {!baseUrlConfigured && (
        <div className="surface border border-rose-200 bg-rose-50/80 p-6 text-sm text-ink-soft">
          Defina a variavel <strong>VITE_API_BASE_URL</strong> para conectar o
          front-end ao backend (ex: <strong>http://localhost:8000</strong>) e
          reinicie o servidor do Vite.
        </div>
      )}

      {missingInfo && (
        <div className="surface border border-amber-200 bg-amber-50/80 p-6 text-sm text-ink-soft">
          O contrato `contracts/openapi.v1.yaml` ainda nao define{" "}
          {missingInfo.endpoints}. Assim que isso acontecer, {missingInfo.hint}
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
          {!baseUrlConfigured && (
            <p className="mt-4 text-sm text-ink-soft">
              Configure a variavel VITE_API_BASE_URL para habilitar a listagem.
            </p>
          )}

          {baseUrlConfigured && !listReady && (
            <p className="mt-4 text-sm text-ink-soft">
              Endpoint GET /lancamentos nao definido no OpenAPI.
            </p>
          )}

          {canList && loading && (
            <p className="mt-4 text-sm text-ink-soft">Carregando...</p>
          )}
          {canList && fetchError && (
            <p className="mt-4 text-sm text-rose-600">{fetchError}</p>
          )}

          {canList && !loading && !fetchError && rows.length === 0 && !rawResponse && (
            <p className="mt-4 text-sm text-ink-soft">Nenhum lancamento exibido.</p>
          )}

          {canList && rawResponse && (
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink/5 p-4 text-xs text-ink">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          )}

          {canList && rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-ink-soft">
                    {columns.map((column) => (
                      <th key={column} className="px-3 py-2 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-b border-border/60">
                      {columns.map((column) => (
                        <td key={column} className="px-3 py-3 text-ink">
                          {typeof row[column] === "object"
                            ? JSON.stringify(row[column])
                            : String(row[column] ?? "-")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="surface p-6">
          <h2 className="section-title">Novo lancamento</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Campos gerados a partir do contrato OpenAPI.
          </p>

          {!baseUrlConfigured && (
            <p className="mt-4 text-sm text-ink-soft">
              Configure a variavel VITE_API_BASE_URL para habilitar o formulario.
            </p>
          )}

          {baseUrlConfigured && !createReady && (
            <p className="mt-4 text-sm text-ink-soft">
              Endpoint POST /lancamentos nao definido no OpenAPI.
            </p>
          )}

          {canCreate && fields.length === 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              Nenhum campo disponivel. Publique o schema do POST /lancamentos no
              OpenAPI.
            </p>
          )}

          {canCreate && fields.length > 0 && (
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

                  {!field.options && field.type === "boolean" && (
                    <label className="flex items-center gap-2 text-sm text-ink-soft">
                      <input
                        type="checkbox"
                        checked={Boolean(formValues[field.name])}
                        onChange={(event) => handleChange(field.name, event.target.checked)}
                      />
                      {formValues[field.name] ? "Sim" : "Nao"}
                    </label>
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

                  {!field.options && !field.isJson && field.type !== "boolean" && (
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
              {submitSuccess && (
                <p className="text-sm font-semibold text-emerald-600">
                  {submitSuccess}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                disabled={!canCreate}
              >
                Salvar lancamento
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
