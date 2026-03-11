export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Review App API',
    version: '1.0.0',
    description:
      'OpenAPI specification for authentication, organization, and invitation flows.',
  },
  servers: [
    {
      url: '/',
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Service hello endpoint',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register user',
        responses: {
          '200': {
            description: 'Registration successful (verification email sent)',
          },
          '400': { description: 'Invalid input' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
          '403': { description: 'Email not verified' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        responses: {
          '200': { description: 'Token refresh successful' },
          '401': { description: 'Missing/invalid refresh token' },
          '403': { description: 'Refresh token expired' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout user',
        responses: {
          '200': { description: 'Logout successful' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        summary: 'Verify email token',
        responses: {
          '201': { description: 'Email verified successfully' },
          '400': { description: 'Invalid token' },
          '409': { description: 'Verification link expired; new email sent' },
        },
      },
    },
    '/organization': {
      post: {
        summary: 'Create organization',
        responses: {
          '200': { description: 'Organization created' },
          '400': { description: 'Invalid request body' },
          '401': { description: 'Unauthorized' },
        },
      },
      get: {
        summary: 'List organizations for authenticated user',
        responses: {
          '200': { description: 'Organizations fetched successfully' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/organization/{id}': {
      get: {
        summary: 'Get organization by id',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description:
              'Organization fetched successfully (includes membershipStatus and invitationId for invited members)',
          },
          '400': { description: 'Invalid organization id format' },
          '403': { description: 'Unauthorized to access organization' },
        },
      },
    },
    '/organization/{id}/invite-user': {
      post: {
        summary: 'Invite user to organization',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['invitedUserRole'],
                properties: {
                  invitedUserId: { type: 'string' },
                  invitedUserEmail: { type: 'string', format: 'email' },
                  invitedUserRole: {
                    type: 'string',
                    enum: ['admin', 'member'],
                  },
                },
              },
            },
          },
        },
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Invitation created successfully' },
          '400': { description: 'Invalid input or ids' },
          '403': { description: 'Permission denied' },
          '404': { description: 'User or organization not found' },
        },
      },
    },
    '/organization-memberships/invitations/{id}/accept': {
      put: {
        summary: 'Accept invitation',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Invitation accepted successfully' },
          '400': { description: 'Invalid invitation id format' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Invitation not found or already processed' },
        },
      },
    },
    '/organization-memberships/invitations/{id}/decline': {
      put: {
        summary: 'Decline invitation',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Invitation declined successfully' },
          '400': { description: 'Invalid invitation id format' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Invitation not found or already processed' },
        },
      },
    },
    '/public/reviews': {
      post: {
        summary: 'Submit a public review (API key required)',
        parameters: [
          {
            in: 'header',
            name: 'X-API-Key',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating', 'text', 'reviewerName', 'reviewerEmail'],
                properties: {
                  externalProductId: {
                    type: 'string',
                    description:
                      'Your own product ID (as provided when registering the product). Omit for org-level reviews.',
                  },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  text: { type: 'string', maxLength: 5000 },
                  reviewerName: { type: 'string' },
                  reviewerEmail: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Review submitted successfully' },
          '400': { description: 'Invalid request body' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Product not found' },
        },
      },
      get: {
        summary: 'List public reviews (API key required)',
        parameters: [
          {
            in: 'header',
            name: 'X-API-Key',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'scope',
            required: false,
            schema: { type: 'string', enum: ['all', 'org', 'product'] },
          },
          {
            in: 'query',
            name: 'externalProductId',
            required: false,
            description:
              'Your own product ID. Only valid when scope=product. Filters reviews to a specific product.',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'page',
            required: false,
            schema: { type: 'integer' },
          },
          {
            in: 'query',
            name: 'limit',
            required: false,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': { description: 'Reviews fetched successfully' },
          '400': { description: 'Invalid query parameters' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/organization/{id}/reviews': {
      get: {
        summary: 'List reviews for organization (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'scope',
            required: false,
            schema: { type: 'string', enum: ['all', 'org', 'product'] },
          },
          {
            in: 'query',
            name: 'externalProductId',
            required: false,
            description:
              'Your own product ID. Only valid when scope=product. Filters reviews to a specific product.',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'status',
            required: false,
            schema: {
              type: 'string',
              enum: ['published', 'pending', 'rejected'],
            },
          },
          {
            in: 'query',
            name: 'page',
            required: false,
            schema: { type: 'integer' },
          },
          {
            in: 'query',
            name: 'limit',
            required: false,
            schema: { type: 'integer' },
          },
          {
            in: 'query',
            name: 'rating',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 5 },
            description: 'Filter by exact star rating (1–5)',
          },
        ],
        responses: {
          '200': { description: 'Reviews fetched successfully' },
          '400': { description: 'Invalid parameters' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/organization/{id}/reviews/{reviewId}': {
      get: {
        summary: 'Get a single review (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'reviewId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Review fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    review: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        externalProductId: { type: 'string' },
                        productName: { type: 'string' },
                        organizationId: { type: 'string' },
                        rating: { type: 'integer' },
                        text: { type: 'string' },
                        reviewerName: { type: 'string' },
                        reviewerEmail: { type: 'string' },
                        status: {
                          type: 'string',
                          enum: ['published', 'pending', 'rejected'],
                        },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid ID format' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Review not found' },
        },
      },
    },
    '/organization/{organizationId}/products': {
      get: {
        summary: 'List products for organization (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Products fetched successfully' },
          '400': { description: 'Invalid organization id format' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
      post: {
        summary: 'Create product (JWT required, admin only)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['externalProductId', 'name', 'slug'],
                properties: {
                  externalProductId: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  active: { type: 'boolean' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Product created successfully' },
          '400': { description: 'Invalid request body' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin only' },
          '409': {
            description:
              'Product with this externalProductId or slug already exists',
          },
        },
      },
    },
    '/organization/{organizationId}/products/{externalProductId}': {
      get: {
        summary: 'Get product by external ID (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'externalProductId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Product fetched successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Product not found' },
        },
      },
      put: {
        summary: 'Update product by external ID (JWT required, admin only)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'externalProductId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  active: { type: 'boolean' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Product updated successfully' },
          '400': { description: 'Invalid request body' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin only' },
          '404': { description: 'Product not found' },
          '409': { description: 'Product with this slug already exists' },
        },
      },
      delete: {
        summary: 'Delete product by external ID (JWT required, admin only)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'externalProductId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Product deleted successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — admin only' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/public/products/bulk': {
      post: {
        summary: 'Bulk create products (API key required)',
        parameters: [
          {
            in: 'header',
            name: 'X-API-Key',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['products'],
                properties: {
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['externalProductId', 'name', 'slug'],
                      properties: {
                        externalProductId: { type: 'string' },
                        name: { type: 'string' },
                        slug: { type: 'string' },
                        description: { type: 'string' },
                        active: { type: 'boolean' },
                        metadata: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Bulk operation completed with per-item results',
          },
          '400': { description: 'Invalid request body' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/organization/{organizationId}/analytics/summary': {
      get: {
        summary: 'Get analytics summary for organization (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'externalProductId',
            required: false,
            description:
              'Filter analytics to a specific product by its external ID.',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'startDate',
            required: false,
            description:
              'ISO date string — include only reviews on or after this date.',
            schema: { type: 'string', format: 'date' },
          },
          {
            in: 'query',
            name: 'endDate',
            required: false,
            description:
              'ISO date string — include only reviews on or before this date.',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Analytics summary fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        totalReviews: { type: 'integer' },
                        averageRating: { type: 'number' },
                        ratingDistribution: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              rating: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 5,
                              },
                              count: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid parameter' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/organization/{organizationId}/analytics/trends': {
      get: {
        summary: 'Get review trends over time for organization (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'granularity',
            required: false,
            description: 'Time bucket size. Defaults to "day".',
            schema: { type: 'string', enum: ['day', 'week', 'month'] },
          },
          {
            in: 'query',
            name: 'externalProductId',
            required: false,
            description: 'Filter to a specific product by its external ID.',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'startDate',
            required: false,
            description:
              'ISO date string — include only reviews on or after this date.',
            schema: { type: 'string', format: 'date' },
          },
          {
            in: 'query',
            name: 'endDate',
            required: false,
            description:
              'ISO date string — include only reviews on or before this date.',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description: 'Analytics trends fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          period: {
                            type: 'string',
                            description:
                              'e.g. "2025-03-15" or "2025-W11" or "2025-03"',
                          },
                          count: { type: 'integer' },
                          averageRating: { type: 'number' },
                        },
                      },
                    },
                    granularity: {
                      type: 'string',
                      enum: ['day', 'week', 'month'],
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid parameter' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/organization/{organizationId}/analytics/export': {
      get: {
        summary: 'Export reviews as CSV for organization (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'organizationId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'externalProductId',
            required: false,
            description: 'Filter to a specific product by its external ID.',
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'startDate',
            required: false,
            description:
              'ISO date string — include only reviews on or after this date.',
            schema: { type: 'string', format: 'date' },
          },
          {
            in: 'query',
            name: 'endDate',
            required: false,
            description:
              'ISO date string — include only reviews on or before this date.',
            schema: { type: 'string', format: 'date' },
          },
        ],
        responses: {
          '200': {
            description:
              'CSV file download. If capped at 10 000 rows, the response includes X-Export-Truncated: true header.',
            headers: {
              'X-Export-Truncated': {
                description:
                  'Present and set to "true" when the result was capped at 10 000 rows.',
                schema: { type: 'string' },
              },
            },
            content: {
              'text/csv': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '400': { description: 'Invalid parameter' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/organization/{id}/reviews/{reviewId}/status': {
      patch: {
        summary: 'Update review status (JWT required)',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'reviewId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Review status updated successfully' },
          '400': { description: 'Invalid request body' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Review not found' },
        },
      },
    },
  },
};
