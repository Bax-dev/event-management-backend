class PaginationUtil {
  static parseParams(query) {
    const page = query.page
      ? Math.max(1, parseInt(String(query.page), 10))
      : 1;
    const limit = query.limit
      ? Math.min(100, Math.max(1, parseInt(String(query.limit), 10)))
      : 10;
    const sortBy = query.sortBy ? String(query.sortBy) : 'createdAt';
    const sortOrder =
      query.sortOrder === 'asc' || query.sortOrder === 'desc'
        ? query.sortOrder
        : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  static calculateOffset(page, limit) {
    return (page - 1) * limit;
  }

  static createResponse(data, total, params) {
    const { page = 1, limit = 10 } = params;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  static validateSortField(field, allowedFields) {
    return allowedFields.includes(field);
  }
}

module.exports = { PaginationUtil };
