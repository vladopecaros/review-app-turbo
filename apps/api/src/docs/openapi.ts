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
            name: 'productId',
            required: false,
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
          '200': { description: 'Review fetched successfully' },
          '400': { description: 'Invalid ID format' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Review not found' },
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
