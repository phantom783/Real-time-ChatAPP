# Deployment Checklist

## Pre-Deployment Planning

- [ ] Define deployment target (local, cloud, VPS, etc.)
- [ ] Plan database strategy (local MongoDB, MongoDB Atlas, etc.)
- [ ] Choose hosting platform (Heroku, AWS, DigitalOcean, Netlify, Vercel, etc.)
- [ ] Estimate resource requirements (CPU, RAM, storage)
- [ ] Plan backup and disaster recovery strategy
- [ ] Setup monitoring and alerting
- [ ] Plan scaling strategy

## Environment Configuration

### Backend (.env)
- [ ] Update `NODE_ENV=production`
- [ ] Update `JWT_SECRET` with strong random 32+ character string
- [ ] Update `MONGO_URI` with production database
- [ ] Update `CORS_ORIGIN` to production domain(s)
- [ ] Set `PORT` to appropriate value (usually 5000 or 80)
- [ ] Update `MONGO_TIMEOUT` if needed
- [ ] Set `LOG_LEVEL` to `info` or `warn`

### Frontend (.env.local)
- [ ] Update `VITE_API_URL` to production backend URL
- [ ] Set `VITE_ENVIRONMENT=production`
- [ ] Verify all API endpoints point to production server

## Database Setup

- [ ] MongoDB is installed and running
- [ ] Database authentication is enabled
- [ ] Database backups are configured
- [ ] Database indexing is optimized
- [ ] Test database connectivity from backend
- [ ] Verify data migrations/seeds are run

## Code Quality & Security

- [ ] Run linter: `npm run lint`
- [ ] Check for console.log statements and remove
- [ ] Review error messages (no sensitive data exposed)
- [ ] Verify no hardcoded secrets or API keys
- [ ] Run security audit: `npm audit`
- [ ] Update all dependencies: `npm update`
- [ ] Remove test/debug files from production
- [ ] Review and fix any TODO/FIXME comments

## Frontend Build

- [ ] Run build: `npm run build`
- [ ] Verify dist folder is created
- [ ] Check build output size (should be < 1MB for main bundle)
- [ ] Test build output locally: `npm run preview`
- [ ] Verify all assets are included
- [ ] Check for broken imports or missing files
- [ ] Verify environment variables are used correctly

## Backend Preparation

- [ ] Remove test routes and debug endpoints
- [ ] Verify all routes are protected with authentication where needed
- [ ] Test all API endpoints on production database
- [ ] Setup rate limiting for API endpoints
- [ ] Configure error logging and monitoring
- [ ] Setup request validation middleware
- [ ] Verify CORS configuration is secure
- [ ] Test file uploads (if applicable)

## Docker Setup (if using containers)

- [ ] Build frontend image: `docker build .`
- [ ] Build backend image: `docker build ./backend`
- [ ] Test docker-compose locally: `docker-compose up`
- [ ] Verify all services communicate correctly
- [ ] Check volume mappings are correct
- [ ] Verify environment variables are passed correctly
- [ ] Test scaling with multiple containers
- [ ] Setup health checks

## Security

- [ ] SSL/HTTPS certificate obtained and installed
- [ ] Password requirements enforced
- [ ] JWT token expiration set appropriately
- [ ] CORS is restricted to production domain only
- [ ] CSRF protection enabled (if applicable)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using mongoose/parameterized queries)
- [ ] XSS protection configured
- [ ] Rate limiting configured
- [ ] Request size limits set
- [ ] Security headers configured (helmet.js recommended)
- [ ] Firewall rules configured
- [ ] API keys/secrets stored in environment variables
- [ ] Database credentials not in code
- [ ] No debug mode enabled in production

## Performance Optimization

- [ ] Frontend minification enabled
- [ ] CSS/JS bundling optimized
- [ ] Image compression enabled
- [ ] Database queries optimized (indexes created)
- [ ] Caching headers configured
- [ ] CDN setup (if applicable)
- [ ] Compression middleware enabled on backend
- [ ] Database connection pooling configured

## Testing

- [ ] User signup/login flow tested
- [ ] Friend request send/accept/reject tested
- [ ] Direct messaging tested
- [ ] Chat room creation and messaging tested
- [ ] Encryption/decryption tested
- [ ] File uploads tested (if applicable)
- [ ] Error handling tested
- [ ] Edge cases tested
- [ ] Load testing performed
- [ ] Cross-browser testing done

## Deployment

### Choose Deployment Method:

#### Option A: Docker Compose
- [ ] Docker and docker-compose installed on server
- [ ] Run `docker-compose up -d`
- [ ] Verify containers are running
- [ ] Check logs: `docker-compose logs -f`

#### Option B: Manual Installation
- [ ] Node.js v14+ installed
- [ ] MongoDB installed and running
- [ ] Git repository cloned
- [ ] Dependencies installed for both frontend and backend
- [ ] Environment files created and configured
- [ ] Frontend built: `npm run build`
- [ ] Backend started with PM2 or systemd
- [ ] Frontend served with nginx or express.static

#### Option C: Cloud Platform (Heroku/AWS/etc)
- [ ] Platform account created and configured
- [ ] Environment variables set in platform
- [ ] Build packs/runtime configured
- [ ] Database initialized on platform
- [ ] Deployment triggered
- [ ] Logs monitored

## Post-Deployment Verification

- [ ] Application loads without errors
- [ ] API returns valid responses
- [ ] Database connectivity verified
- [ ] User signup works
- [ ] User login works
- [ ] Friend requests work
- [ ] Messaging works
- [ ] File uploads work (if applicable)
- [ ] Encryption is working
- [ ] Static assets load correctly
- [ ] Error pages display properly
- [ ] Browser console is clear of errors
- [ ] Network tab shows no 404/500 errors

## Monitoring & Maintenance

- [ ] Setup application monitoring (New Relic, DataDog, etc.)
- [ ] Setup error tracking (Sentry, Rollbar, etc.)
- [ ] Setup database monitoring
- [ ] Setup server monitoring (CPU, RAM, disk)
- [ ] Setup uptime monitoring
- [ ] Email alerts configured for errors
- [ ] Log aggregation setup
- [ ] Regular backup schedule configured
- [ ] Backup testing procedure documented
- [ ] Incident response plan documented

## Documentation

- [ ] README.md updated with deployment instructions
- [ ] DEPLOYMENT.md created with full deployment guide
- [ ] API documentation created/updated
- [ ] Troubleshooting guide created
- [ ] Development setup guide created
- [ ] Architecture documentation created
- [ ] Runbook for common problems created

## DNS & Domain

- [ ] Domain name registered
- [ ] DNS records configured (A record pointing to server)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Subdomain configuration (www, api, etc.)
- [ ] Email records configured (if needed)

## Final Checks

- [ ] Test all user workflows
- [ ] Performance is acceptable (load times < 3s)
- [ ] Mobile responsiveness verified
- [ ] Accessibility verified (WCAG standards)
- [ ] Backup system is working
- [ ] Disaster recovery plan is in place
- [ ] Team is trained on deployment and rollback
- [ ] Documentation is accessible to team

## Rollback Plan

- [ ] Previous version is backed up
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging
- [ ] Team knows how to execute rollback
- [ ] Database backup available for rollback

## Go-Live

- [ ] All checklist items completed
- [ ] Team briefing completed
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Status page prepared
- [ ] All systems ready
- [ ] Deploy to production
- [ ] Monitor system closely for first 24 hours
- [ ] Gather feedback and fix critical issues
- [ ] Post-launch retrospective scheduled

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verification By:** _______________  
**Sign-off Date:** _______________  

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```
