export function buildDynamicSearch(model: any, queryParams: any = {}) {
  const filter: any = {};
  const search: any = {};
  const options: any = {};

  // --- Search (dynamic string fields)
  if (queryParams.search) {
    const regex = new RegExp(queryParams.search, "i");
    const stringFields = Object.keys(model.schema.paths)
      .filter((key) => model.schema.paths[key].instance === "String");
    search.$or = stringFields.map((field) => ({ [field]: regex }));
  }

  // --- Filters
  Object.keys(queryParams).forEach((key) => {
    if (["page", "limit", "sort", "search"].includes(key)) return;
    filter[key] = queryParams[key];
  });

  // --- Sorting
  if (queryParams.sort) {
    const sortObj: any = {};
    queryParams.sort.split(",").forEach((field: string) => {
      if (field.startsWith("-")) sortObj[field.substring(1)] = -1;
      else sortObj[field] = 1;
    });
    options.sort = sortObj;
  } else {
    options.sort = { createdAt: -1 };
  }

  // --- Pagination
  const page = Number(queryParams.page) || 1;
  const limit = queryParams.limit ? Number(queryParams.limit) : 0;

  if (limit > 0) {
    options.skip = (page - 1) * limit;
    options.limit = limit;
  } else {
    options.skip = 0;
    options.limit = 0; // no limit, return all documents
  }

  return { filter, search, options };
}
