import yaml from "yaml";
import openapiRaw from "../../contracts/openapi.v1.yaml?raw";

let cachedDoc = null;

export function getOpenApiDocument() {
  if (cachedDoc) {
    return cachedDoc;
  }
  try {
    cachedDoc = yaml.parse(openapiRaw);
  } catch (error) {
    cachedDoc = null;
  }
  return cachedDoc;
}

export function getBaseUrl(doc) {
  return doc?.servers?.[0]?.url || "http://localhost";
}

export function hasPath(doc, path) {
  return Boolean(doc?.paths?.[path]);
}

export function getOperation(doc, path, method) {
  const pathSpec = doc?.paths?.[path];
  if (!pathSpec) {
    return null;
  }
  return pathSpec[method.toLowerCase()] || null;
}

function resolveRef(ref, doc) {
  if (!ref || !ref.startsWith("#/")) {
    return null;
  }
  const parts = ref.slice(2).split("/");
  let current = doc;
  for (const part of parts) {
    current = current?.[part];
    if (!current) {
      return null;
    }
  }
  return current;
}

export function resolveSchema(schema, doc) {
  if (!schema) {
    return null;
  }
  if (schema.$ref) {
    return resolveSchema(resolveRef(schema.$ref, doc), doc);
  }
  return schema;
}

function pickJsonSchema(content, doc) {
  if (!content) {
    return null;
  }
  const json = content["application/json"] || Object.values(content)[0];
  return resolveSchema(json?.schema, doc);
}

export function getRequestSchema(doc, path, method) {
  const operation = getOperation(doc, path, method);
  if (!operation) {
    return null;
  }
  return pickJsonSchema(operation.requestBody?.content, doc);
}

export function getResponseSchema(doc, path, method, status = "200") {
  const operation = getOperation(doc, path, method);
  if (!operation) {
    return null;
  }
  const responses = operation.responses || {};
  const response = responses[status] || responses[Number(status)] || responses.default;
  return pickJsonSchema(response?.content, doc);
}
