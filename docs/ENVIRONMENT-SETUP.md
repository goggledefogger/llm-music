# Environment Setup Guide

## Overview

This guide explains how to set up environment variables for both development and production environments for the ASCII Generative Sequencer.

## Environment Files Structure

```
llm-music/
├── .env.example          # Template file (visible)
├── .env.local           # Development environment (hidden)
├── .env.production      # Production environment (hidden)
└── .env.staging         # Staging environment (hidden)
```

## Required Environment Variables

### Supabase Configuration

```bash
# Supabase Project URL
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Key (public, safe for frontend)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (private, backend only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### OpenAI Configuration

```bash
# OpenAI API Key for AI pattern generation
OPENAI_API_KEY=sk-...
```

### Application Configuration

```bash
# Environment mode
NODE_ENV=production

# Application URL
VITE_APP_URL=https://your-domain.com

# Optional: Analytics and monitoring
VITE_VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
```

## Development Environment Setup

### 1. Create Development Environment File

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your development values
nano .env.local
```

### 2. Development Environment Variables

```bash
# .env.local
# Supabase (Local Development)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# OpenAI (Use your actual API key)
OPENAI_API_KEY=sk-your-actual-openai-api-key

# Application
NODE_ENV=development
VITE_APP_URL=http://localhost:3000
```

### 3. Start Local Supabase (Optional)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase stack
supabase start

# This will give you local URLs and keys
```

## Production Environment Setup

### 1. Vercel Environment Variables

Set these in your Vercel dashboard or via CLI:

```bash
# Set environment variables in Vercel
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add NODE_ENV production
vercel env add VITE_APP_URL production
```

### 2. Production Environment Values

```bash
# Production values (replace with your actual values)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-your-production-openai-key
NODE_ENV=production
VITE_APP_URL=https://your-domain.com
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be created

### 2. Get Supabase Credentials

1. Go to Project Settings → API
2. Copy the following:
   - Project URL
   - Anon (public) key
   - Service role (secret) key

### 3. Set up Database Schema

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > packages/shared/src/types/supabase.ts
```

### 4. Configure Authentication

1. Go to Authentication → Settings
2. Enable email/password authentication
3. Configure OAuth providers if needed
4. Set up redirect URLs

## OpenAI Setup

### 1. Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account or sign in
3. Go to API Keys section

### 2. Generate API Key

1. Click "Create new secret key"
2. Give it a name (e.g., "ASCII Sequencer Production")
3. Copy the key (it starts with `sk-`)
4. Store it securely

### 3. Set Usage Limits (Recommended)

1. Go to Usage → Limits
2. Set monthly spending limits
3. Monitor usage regularly

## Environment Variable Security

### Frontend Variables (VITE_*)

- Safe to expose in browser
- Used for client-side configuration
- Examples: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Backend Variables

- Must be kept secret
- Only used in server-side code
- Examples: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`

### Best Practices

1. **Never commit secrets to version control**
2. **Use different keys for different environments**
3. **Rotate keys regularly**
4. **Monitor usage and costs**
5. **Use environment-specific configurations**

## Environment Validation

### 1. Create Validation Script

```typescript
// scripts/validate-env.ts
import { config } from 'dotenv';

config({ path: '.env.local' });

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

### 2. Add to Package.json

```json
{
  "scripts": {
    "validate-env": "tsx scripts/validate-env.ts"
  }
}
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Check file name (`.env.local` not `.env.local.txt`)
   - Restart development server
   - Check for typos in variable names

2. **Supabase connection issues**
   - Verify project URL and keys
   - Check if project is active
   - Ensure RLS policies are configured

3. **OpenAI API issues**
   - Verify API key is correct
   - Check usage limits and billing
   - Ensure key has proper permissions

4. **Build failures**
   - Check if all required variables are set
   - Verify variable names match exactly
   - Check for special characters in values

### Debug Commands

```bash
# Check environment variables
echo $VITE_SUPABASE_URL

# Validate Supabase connection
supabase status

# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check Vercel environment variables
vercel env ls
```

## Environment-Specific Configurations

### Development

- Use local Supabase instance
- Enable debug logging
- Use development API keys
- Allow insecure connections

### Staging

- Use staging Supabase project
- Limited OpenAI usage
- Production-like configuration
- Test data only

### Production

- Use production Supabase project
- Full OpenAI access
- Optimized configuration
- Real user data

## Monitoring and Alerts

### 1. Set up Monitoring

```bash
# Monitor environment variable usage
# Set up alerts for:
# - Supabase quota usage
# - OpenAI API usage
# - Error rates
# - Performance metrics
```

### 2. Cost Monitoring

- Monitor Supabase usage and costs
- Track OpenAI API usage and spending
- Set up billing alerts
- Review costs monthly

## Migration Between Environments

### 1. Database Migration

```bash
# Export from development
supabase db dump --local > backup.sql

# Import to production
supabase db reset --linked
psql -h your-host -U postgres -d postgres < backup.sql
```

### 2. Environment Variable Migration

```bash
# Export environment variables
vercel env pull .env.production

# Review and update values
# Deploy to new environment
```

## Security Checklist

- [ ] All secrets are in environment variables
- [ ] No secrets in version control
- [ ] Different keys for different environments
- [ ] API keys have appropriate permissions
- [ ] Usage limits are set
- [ ] Monitoring is configured
- [ ] Regular key rotation planned

---

## Quick Setup Commands

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Edit with your values
nano .env.local

# 3. Validate environment
pnpm validate-env

# 4. Start development
pnpm dev:web
# In a separate terminal if working on AI
pnpm dev:api

# 5. Deploy to production
pnpm deploy
```

Your environment is now configured and ready for deployment! 🚀


