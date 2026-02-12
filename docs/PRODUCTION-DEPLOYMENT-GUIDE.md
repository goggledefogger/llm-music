# Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the ASCII Generative Sequencer to production using Vercel, Supabase, and GitHub Actions.

## Architecture Summary

- **Frontend**: React app deployed to Vercel with global CDN
- **Backend**: Vercel Edge Functions for API endpoints
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with social providers
- **AI Integration**: OpenAI API for pattern generation
- **CI/CD**: GitHub Actions for automated testing and deployment

## Prerequisites

### Required Accounts
- [Vercel Account](https://vercel.com) (free tier available)
- [Supabase Account](https://supabase.com) (free tier available)
- [GitHub Account](https://github.com) (for CI/CD)
- [OpenAI Account](https://openai.com) (for AI features)

### Required Tools
- Node.js 18+ and pnpm 9.0+
- Vercel CLI: `npm install -g vercel`
- Supabase CLI: `npm install -g supabase`

## Step 1: Environment Setup

### 1.1 Create Environment Files

Create the following environment files (they exist but are hidden):

**`.env.example`** (template):
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Application Configuration
NODE_ENV=production
VITE_APP_URL=https://your-domain.com
```

**`.env.local`** (development):
```bash
# Copy from .env.example and fill in development values
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
VITE_APP_URL=http://localhost:3000
```

### 1.2 Supabase Setup

1. **Create Supabase Project**:
   ```bash
   # Login to Supabase
   supabase login

   # Create new project
   supabase projects create ascii-sequencer-prod
   ```

2. **Set up Database Schema**:
   ```bash
   # Link to your project
   supabase link --project-ref your-project-ref

   # Apply migrations
   supabase db push

   # Generate TypeScript types
   supabase gen types typescript --local > packages/shared/src/types/supabase.ts
   ```

3. **Configure Authentication**:
   - Go to Supabase Dashboard → Authentication → Settings
   - Enable email/password authentication
   - Configure OAuth providers (Google, GitHub) if needed
   - Set up redirect URLs for your domain

4. **Set up Row Level Security**:
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

   -- Create policies (see architecture.md for full schema)
   ```

## Step 2: Vercel Setup

### 2.1 Install and Configure Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link
```

### 2.2 Configure Vercel Project

1. **Set Build Settings**:
   - Framework Preset: `Other`
   - Build Command: `pnpm build`
   - Output Directory: `apps/web/dist`
   - Install Command: `pnpm install`

2. **Configure Environment Variables**:
   ```bash
   # Set production environment variables
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add OPENAI_API_KEY production
   vercel env add NODE_ENV production
   ```

### 2.3 Deploy to Vercel

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Step 3: GitHub Actions Setup

### 3.1 Configure Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### 3.2 Get Vercel Credentials

```bash
# Get your Vercel token
vercel tokens list

# Get your project ID
vercel project ls
```

### 3.3 Test CI/CD Pipeline

1. Create a pull request to test staging deployment
2. Merge to main to test production deployment
3. Check GitHub Actions tab for deployment status

## Step 4: Domain and SSL Setup

### 4.1 Custom Domain (Optional)

1. **Add Domain in Vercel**:
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain (e.g., `ascii-sequencer.com`)

2. **Configure DNS**:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A records for Vercel IPs

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - Force HTTPS redirect in Vercel settings

## Step 5: Monitoring and Analytics

### 5.1 Vercel Analytics

```bash
# Enable Vercel Analytics
vercel analytics enable
```

### 5.2 Error Tracking (Optional)

Add Sentry for error tracking:

```bash
# Install Sentry
pnpm add @sentry/react @sentry/tracing

# Configure in your app
```

### 5.3 Performance Monitoring

- Vercel Analytics provides Core Web Vitals
- Supabase Dashboard shows database performance
- Monitor OpenAI API usage and costs

## Step 6: Production Checklist

### Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Authentication configured
- [ ] API keys secured

### Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Audio engine initializes
- [ ] Pattern creation/editing works
- [ ] AI integration functional
- [ ] Database connections stable
- [ ] Performance metrics acceptable
- [ ] Error tracking active

## Step 7: Deployment Commands

### Quick Deploy Commands

```bash
# Full deployment workflow
pnpm test && pnpm build && vercel --prod

# Staging deployment
vercel

# Production deployment
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs
```

### Database Management

```bash
# Apply new migrations
supabase db push

# Reset database (careful!)
supabase db reset

# Generate new types
supabase gen types typescript --local > packages/shared/src/types/supabase.ts
```

## Step 8: Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check build locally
   pnpm build

   # Check Vercel build logs
   vercel logs
   ```

2. **Environment Variable Issues**:
   ```bash
   # List environment variables
   vercel env ls

   # Add missing variables
   vercel env add VARIABLE_NAME production
   ```

3. **Database Connection Issues**:
   ```bash
   # Check Supabase status
   supabase status

   # Test connection
   supabase db shell
   ```

4. **Audio Context Issues**:
   - Ensure HTTPS is enabled (required for Web Audio API)
   - Check browser console for audio context errors
   - Verify user interaction requirements

### Performance Optimization

1. **Bundle Size**:
   ```bash
   # Analyze bundle
   pnpm build
   npx vite-bundle-analyzer dist
   ```

2. **Database Performance**:
   - Monitor query performance in Supabase Dashboard
   - Add database indexes for frequently queried fields
   - Use connection pooling

3. **CDN Optimization**:
   - Vercel automatically optimizes static assets
   - Enable compression and caching headers

## Step 9: Maintenance

### Regular Tasks

1. **Weekly**:
   - Monitor error rates and performance
   - Check OpenAI API usage and costs
   - Review user feedback and issues

2. **Monthly**:
   - Update dependencies (`pnpm update`)
   - Review and optimize database queries
   - Check security updates

3. **Quarterly**:
   - Review and update architecture
   - Plan feature updates
   - Analyze usage patterns and growth

### Backup Strategy

1. **Database Backups**:
   - Supabase provides automatic daily backups
   - Export data regularly for additional safety

2. **Code Backups**:
   - GitHub provides full repository history
   - Tag releases for easy rollback

3. **Configuration Backups**:
   - Document all environment variables
   - Keep deployment configurations in version control

## Security Considerations

### Production Security

1. **Environment Variables**:
   - Never commit API keys to version control
   - Use Vercel's secure environment variable storage
   - Rotate keys regularly

2. **Database Security**:
   - Enable Row Level Security (RLS)
   - Use service role keys only for server-side operations
   - Monitor database access logs

3. **API Security**:
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS for all communications

4. **Authentication Security**:
   - Use strong password policies
   - Enable two-factor authentication where possible
   - Monitor authentication logs

## Cost Management

### Vercel Costs
- Free tier: 100GB bandwidth, 100 serverless function executions
- Pro tier: $20/month for higher limits

### Supabase Costs
- Free tier: 500MB database, 50MB file storage
- Pro tier: $25/month for higher limits

### OpenAI Costs
- Pay-per-use based on API calls
- Monitor usage in OpenAI dashboard
- Implement usage limits if needed

## Support and Documentation

### Getting Help

1. **Vercel Support**: [Vercel Documentation](https://vercel.com/docs)
2. **Supabase Support**: [Supabase Documentation](https://supabase.com/docs)
3. **Project Issues**: Create GitHub issues for bugs and features

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [GitHub Actions](https://github.com/features/actions)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## Quick Start Deployment

For a quick deployment, run these commands:

```bash
# 1. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 2. Deploy to Vercel
vercel login
vercel link
vercel --prod

# 3. Set up GitHub Actions
# Add secrets to GitHub repository
# Push to main branch to trigger deployment
```

Your ASCII Generative Sequencer will be live at your Vercel domain! 🎵


