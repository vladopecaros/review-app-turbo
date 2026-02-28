import express from 'express';
import cookieParser from 'cookie-parser';
import { UserRepository } from './modules/user/user.repository';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { createAuthRoutes } from './modules/auth/auth.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { EmailService } from './modules/email/email.service';
import { createOrganizationRoutes } from './modules/organization/organization.routes';
import { OrganizationController } from './modules/organization/organization.controller';
import { OrganizationService } from './modules/organization/organization.service';
import { OrganizationRepository } from './modules/organization/organization.repository';
import { OrganizationMembershipRepository } from './modules/organizationMembership/organizationMembership.repository';
import { UserService } from './modules/user/user.service';
import { OrganizationMembershipController } from './modules/organizationMembership/organizationMembership.controller';
import { OrganizationMembershipService } from './modules/organizationMembership/organizationMembership.service';
import { createOrganizationMembershipRoutes } from './modules/organizationMembership/organizationMembership.routes';
import { openApiSpec } from './docs/openapi';
import { ProductRepository } from './modules/product/product.repository';
import { ProductService } from './modules/product/product.service';
import { ProductController } from './modules/product/product.controller';
import { createProductRoutes } from './modules/product/product.routes';
import { ReviewRepository } from './modules/review/review.repository';
import { ReviewService } from './modules/review/review.service';
import { ReviewController } from './modules/review/review.controller';
import { PublicReviewController } from './modules/review/publicReview.controller';
import { createReviewRoutes } from './modules/review/review.routes';
import { createPublicReviewRoutes } from './modules/review/publicReview.routes';
import { createRequireApiKey } from './middlewares/apiKey.middleware';

// DEPENDENCIES FOR CONTROLLERS
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const emailService = new EmailService();
const authService = new AuthService(userRepository, emailService);
const organizationRepository = new OrganizationRepository();
const organizationMembershipRepository = new OrganizationMembershipRepository();
const organizationService = new OrganizationService(
  organizationRepository,
  organizationMembershipRepository,
  emailService,
  userService,
);
const organizationMembershipService = new OrganizationMembershipService(
  organizationMembershipRepository,
);
const productRepository = new ProductRepository();
const productService = new ProductService(
  productRepository,
  organizationService,
);
const reviewRepository = new ReviewRepository();
const reviewService = new ReviewService(
  reviewRepository,
  organizationService,
  productRepository,
);

// CONTROLLERS
const authController = new AuthController(authService);
const organizationController = new OrganizationController(organizationService);
const organizationMembershipController = new OrganizationMembershipController(
  organizationMembershipService,
);
const productController = new ProductController(productService);
const reviewController = new ReviewController(reviewService);
const publicReviewController = new PublicReviewController(reviewService);

const app = express();
const requireApiKey = createRequireApiKey(organizationRepository);

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'http://localhost:3000') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  );
  const requestHeaders = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    requestHeaders ?? 'Content-Type, Authorization',
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use('/auth', createAuthRoutes(authController));
app.use('/organization', createOrganizationRoutes(organizationController));
app.use(
  '/organization-memberships',
  createOrganizationMembershipRoutes(organizationMembershipController),
);
app.use(
  '/organization/:organizationId/products',
  createProductRoutes(productController),
);
app.use(
  '/organization/:organizationId/reviews',
  createReviewRoutes(reviewController),
);
app.use(
  '/public/reviews',
  requireApiKey,
  createPublicReviewRoutes(publicReviewController),
);

app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express + TypeScript 🚀' });
});

app.get('/docs/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.get('/docs', (_req, res) => {
  res.type('text/plain').send('OpenAPI spec available at /docs/openapi.json');
});

app.use(errorMiddleware);

export default app;
