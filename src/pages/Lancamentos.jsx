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

function buildFieldConfig(schema, doc, options = {}) {
  const resolved = resolveSchema(schema, doc);
  if (!resolved || resolved.type !== "object") {
    return [];
  }

  const required = new Set(resolved.required || []);
  const omit = new Set(options.omit || []);

  return Object.entries(resolved.properties || {})
    .filter(([name]) => !omit.has(name))
    .map(([name, definition]) => {
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

function getSchemaVariants(schema, doc) {
  const resolved = resolveSchema(schema, doc);
  if (!resolved || !resolved.oneOf) {
    return null;
  }

  const propertyName = resolved.discriminator?.propertyName || null;
  const mapping = resolved.discriminator?.mapping || {};
  const options = [];

  if (Object.keys(mapping).length > 0) {
    Object.entries(mapping).forEach(([value, ref]) => {
      const resolvedSchema = resolveSchema({ $ref: ref }, doc);
      if (!resolvedSchema) {
        return;
      }
      options.push({ value, schema: resolvedSchema });
    });
  } else {
    resolved.oneOf.forEach((entry, index) => {
      const resolvedSchema = resolveSchema(entry, doc) || entry;
      if (!resolvedSchema) {
        return;
      }
      let value = null;
      if (propertyName) {
        const propSchema =
          resolveSchema(resolvedSchema?.properties?.[propertyName], doc) ||
          resolvedSchema?.properties?.[propertyName];
        if (propSchema?.enum?.length === 1) {
          value = propSchema.enum[0];
        }
      }
      options.push({
        value: value || `opcao_${index + 1}`,
        schema: resolvedSchema
      });
    });
  }

  if (options.length === 0) {
    return null;
  }

  return { propertyName, options };
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
  const categoriasReady = useMemo(
    () => Boolean(getOperation(doc, "/categorias", "get")),
    [doc]
  );
  const formasReady = useMemo(
    () => Boolean(getOperation(doc, "/formas-pagamento", "get")),
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
  const variantConfig = useMemo(
    () => getSchemaVariants(requestSchema, doc),
    [requestSchema, doc]
  );
  const variantOptions = variantConfig?.options || [];
  const variantKey = useMemo(
    () => variantOptions.map((option) => option.value).join("|"),
    [variantOptions]
  );
  const [variantValue, setVariantValue] = useState("");
  const hasVariants = variantOptions.length > 0;
  const activeSchema = useMemo(() => {
    if (!hasVariants) {
      return requestSchema;
    }
    if (!variantValue) {
      return null;
    }
    return (
      variantOptions.find((option) => option.value === variantValue)?.schema || null
    );
  }, [hasVariants, requestSchema, variantValue, variantOptions]);
  const fields = useMemo(() => {
    if (hasVariants && !activeSchema) {
      return [];
    }
    const omit = hasVariants && variantConfig?.propertyName
      ? [variantConfig.propertyName]
      : [];
    return buildFieldConfig(activeSchema || requestSchema, doc, { omit });
  }, [activeSchema, requestSchema, doc, hasVariants, variantConfig?.propertyName]);
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
  const [categorias, setCategorias] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [categoriasError, setCategoriasError] = useState("");
  const [formasError, setFormasError] = useState("");
  const [categoriasLoading, setCategoriasLoading] = useState(false);
  const [formasLoading, setFormasLoading] = useState(false);
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
    if (!hasVariants) {
      setVariantValue("");
      return;
    }
    setVariantValue((prev) => {
      if (variantOptions.length === 1) {
        return variantOptions[0].value;
      }
      if (variantOptions.some((option) => option.value === prev)) {
        return prev;
      }
      return "";
    });
  }, [variantKey, hasVariants, variantOptions]);

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

  useEffect(() => {
    if (!baseUrlConfigured || !categoriasReady) {
      setCategorias([]);
      return;
    }

    const loadCategorias = async () => {
      setCategoriasLoading(true);
      setCategoriasError("");
      try {
        const data = await apiRequest(baseUrl, "/categorias", { method: "GET" });
        if (Array.isArray(data)) {
          setCategorias(data);
          return;
        }
        if (Array.isArray(data?.items)) {
          setCategorias(data.items);
          return;
        }
        setCategorias([]);
      } catch (error) {
        setCategoriasError("Nao foi possivel carregar as categorias.");
        setCategorias([]);
      } finally {
        setCategoriasLoading(false);
      }
    };

    loadCategorias();
  }, [baseUrl, baseUrlConfigured, categoriasReady]);

  useEffect(() => {
    if (!baseUrlConfigured || !formasReady) {
      setFormasPagamento([]);
      return;
    }

    const loadFormas = async () => {
      setFormasLoading(true);
      setFormasError("");
      try {
        const data = await apiRequest(baseUrl, "/formas-pagamento", { method: "GET" });
        if (Array.isArray(data)) {
          setFormasPagamento(data);
          return;
        }
        if (Array.isArray(data?.items)) {
          setFormasPagamento(data.items);
          return;
        }
        setFormasPagamento([]);
      } catch (error) {
        setFormasError("Nao foi possivel carregar as formas de pagamento.");
        setFormasPagamento([]);
      } finally {
        setFormasLoading(false);
      }
    };

    loadFormas();
  }, [baseUrl, baseUrlConfigured, formasReady]);

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
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

    if (!createReady) {
      setSubmitError("Endpoint POST /lancamentos nao definido no OpenAPI.");
      return;
    }

    if (hasVariants && !variantValue) {
      setSubmitError("Selecione o tipo_lancamento antes de enviar.");
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
      if (variantConfig?.propertyName && variantValue) {
        payload[variantConfig.propertyName] = variantValue;
      }
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
      setValidationErrors([]);
      setRefreshIndex((prev) => prev + 1);
    } catch (error) {
      if (error?.status === 422) {
        const errors = formatValidationErrors(error?.data);
        setValidationErrors(errors);
        setSubmitError("Erro de validacao retornado pela API.");
        setSubmitSuccess("");
        return;
      }
      const detail = error?.data?.detail;
      setValidationErrors([]);
      setSubmitError(detail || "Nao foi possivel criar o lancamento.");
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
          O contrato `contracts/openapi.v2.yaml` ainda nao define{" "}
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

          {canCreate && !hasVariants && fields.length === 0 && (
            <p className="mt-4 text-sm text-ink-soft">
              Nenhum campo disponivel. Publique o schema do POST /lancamentos no
              OpenAPI.
            </p>
          )}

          {canCreate && (hasVariants || fields.length > 0) && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {hasVariants && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink">
                    {variantConfig?.propertyName || "tipo_lancamento"}
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                    value={variantValue}
                    onChange={(event) => setVariantValue(event.target.value)}
                    required
                  >
                    <option value="">Selecione</option>
                    {variantOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {hasVariants && !variantValue && (
                <p className="text-sm text-ink-soft">
                  Selecione um tipo de lancamento para carregar os campos.
                </p>
              )}

              {fields.map((field) => {
                const isCategoriaField = field.name === "categoria_id";
                const isFormaField = field.name === "forma_pagamento_id";
                return (
                  <div key={field.name} className="space-y-2">
                    <label className="text-sm font-semibold text-ink">
                      {field.label}
                    </label>

                    {isCategoriaField && (
                      <>
                        <select
                          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                          value={formValues[field.name]}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                          required={field.required}
                          disabled={!categoriasReady || categoriasLoading}
                        >
                          <option value="">Selecione</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nome || categoria.id}
                            </option>
                          ))}
                        </select>
                        {!categoriasReady && (
                          <p className="text-xs text-ink-soft">
                            Endpoint /categorias nao definido no OpenAPI.
                          </p>
                        )}
                        {categoriasReady && !categoriasLoading && categorias.length === 0 && (
                          <p className="text-xs text-ink-soft">
                            Nenhuma categoria cadastrada.
                          </p>
                        )}
                        {categoriasError && (
                          <p className="text-xs text-rose-600">{categoriasError}</p>
                        )}
                      </>
                    )}

                    {isFormaField && (
                      <>
                        <select
                          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                          value={formValues[field.name]}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                          required={field.required}
                          disabled={!formasReady || formasLoading}
                        >
                          <option value="">Selecione</option>
                          {formasPagamento.map((forma) => (
                            <option key={forma.id} value={forma.id}>
                              {forma.nome || forma.id}
                            </option>
                          ))}
                        </select>
                        {!formasReady && (
                          <p className="text-xs text-ink-soft">
                            Endpoint /formas-pagamento nao definido no OpenAPI.
                          </p>
                        )}
                        {formasReady && !formasLoading && formasPagamento.length === 0 && (
                          <p className="text-xs text-ink-soft">
                            Nenhuma forma cadastrada.
                          </p>
                        )}
                        {formasError && (
                          <p className="text-xs text-rose-600">{formasError}</p>
                        )}
                      </>
                    )}

                    {!isCategoriaField && !isFormaField && field.options && (
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

                    {!isCategoriaField && !isFormaField && field.type === "boolean" && (
                      <label className="flex items-center gap-2 text-sm text-ink-soft">
                        <input
                          type="checkbox"
                          checked={Boolean(formValues[field.name])}
                          onChange={(event) =>
                            handleChange(field.name, event.target.checked)
                          }
                        />
                        {formValues[field.name] ? "Sim" : "Nao"}
                      </label>
                    )}

                    {!isCategoriaField && !isFormaField && field.isJson && (
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                        value={formValues[field.name]}
                        onChange={(event) => handleChange(field.name, event.target.value)}
                        placeholder="JSON conforme o schema"
                        required={field.required}
                      />
                    )}

                    {!isCategoriaField &&
                      !isFormaField &&
                      !field.isJson &&
                      field.type !== "boolean" && (
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
                );
              })}

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
                <p className="text-sm font-semibold text-emerald-600">
                  {submitSuccess}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                disabled={!canCreate || (hasVariants && !variantValue)}
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
