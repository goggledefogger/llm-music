#!/bin/bash

# ASCII Generative Sequencer - Production Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

echo "🚀 Starting ASCII Generative Sequencer deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm 9.0+"
        exit 1
    fi

    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install with: npm install -g vercel"
        exit 1
    fi

    print_success "All dependencies are installed"
}

# Check if environment variables are set
check_environment() {
    print_status "Checking environment configuration..."

    if [ ! -f ".env.local" ]; then
        print_warning ".env.local not found. Please create it from .env.example"
        print_status "Required environment variables:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - VITE_SUPABASE_ANON_KEY"
        echo "  - SUPABASE_SERVICE_ROLE_KEY"
        echo "  - OPENAI_API_KEY"
        exit 1
    fi

    print_success "Environment configuration found"
}

# Run tests
run_tests() {
    print_status "Running tests..."

    if ! pnpm test; then
        print_error "Tests failed. Please fix test failures before deploying."
        exit 1
    fi

    print_success "All tests passed"
}

# Run type checking
run_type_check() {
    print_status "Running type checking..."

    if ! pnpm type-check; then
        print_error "Type checking failed. Please fix type errors before deploying."
        exit 1
    fi

    print_success "Type checking passed"
}

# Run linting
run_linting() {
    print_status "Running linting..."

    if ! pnpm lint; then
        print_error "Linting failed. Please fix linting errors before deploying."
        exit 1
    fi

    print_success "Linting passed"
}

# Build the application
build_application() {
    print_status "Building application..."

    if ! pnpm build; then
        print_error "Build failed. Please fix build errors before deploying."
        exit 1
    fi

    print_success "Application built successfully"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."

    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_error "Not logged in to Vercel. Please run: vercel login"
        exit 1
    fi

    # Deploy to production
    if vercel --prod; then
        print_success "Deployment to Vercel successful!"
    else
        print_error "Deployment to Vercel failed"
        exit 1
    fi
}

# Get deployment URL
get_deployment_url() {
    print_status "Getting deployment URL..."

    # Get the latest deployment URL
    DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "https://ascii-sequencer.vercel.app")

    print_success "Application deployed to: $DEPLOYMENT_URL"
}

# Run post-deployment checks
post_deployment_checks() {
    print_status "Running post-deployment checks..."

    # Check if the application is accessible
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200"; then
        print_success "Application is accessible"
    else
        print_warning "Application may not be accessible yet. Please check manually."
    fi
}

# Main deployment function
main() {
    echo "🎵 ASCII Generative Sequencer Deployment"
    echo "========================================"

    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_BUILD=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --skip-build    Skip building application"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Run deployment steps
    check_dependencies
    check_environment

    if [ "$SKIP_TESTS" = false ]; then
        run_tests
        run_type_check
        run_linting
    else
        print_warning "Skipping tests, type checking, and linting"
    fi

    if [ "$SKIP_BUILD" = false ]; then
        build_application
    else
        print_warning "Skipping build step"
    fi

    deploy_to_vercel
    get_deployment_url
    post_deployment_checks

    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the deployed application"
    echo "2. Check monitoring and error tracking"
    echo "3. Update documentation if needed"
    echo "4. Notify team of successful deployment"
    echo ""
}

# Run main function
main "$@"


