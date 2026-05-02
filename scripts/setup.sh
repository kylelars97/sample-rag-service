#!/usr/bin/env bash
set -euo pipefail

GREEN="\033[0;32m"
RED="\033[0;31m"
RESET="\033[0m"

info() { echo -e "${GREEN}[setup]${RESET} $*"; }
error() { echo -e "${RED}[setup]${RESET} $*" >&2; exit 1; }

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

check_deno() {
  if command_exists deno; then
    info "Deno found: $(deno --version | head -1)"
  else
    info "Installing Deno..."
    curl -fsSL https://deno.land/install.sh | sh
    export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
    export PATH="$DENO_INSTALL/bin:$PATH"
    info "Deno installed: $(deno --version | head -1)"
  fi
}

check_docker() {
  if command_exists docker; then
    info "Docker found: $(docker --version)"
  else
    error "Docker is required but not installed. Install Docker first: https://docs.docker.com/get-docker/"
  fi
}

start_qdrant() {
  info "Starting Qdrant..."
  docker compose -f docker/docker-compose.yml up -d
  info "Qdrant started."
}

check_ollama() {
  if command_exists ollama; then
    info "Ollama found: $(ollama --version 2>/dev/null || echo 'installed')"
  else
    info "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    info "Ollama installed."
  fi
}

pull_models() {
  info "Pulling Ollama models..."
  ollama pull llama3
  ollama pull nomic-embed-text
  info "Models pulled."
}

configure_env() {
  if [ -f .env ]; then
    info ".env already exists, skipping."
  else
    cp .env.example .env
    info ".env created from .env.example."
  fi
}

ingest_data() {
  info "Running ingestion..."
  deno task ingest
  info "Ingestion complete."
}

start_server() {
  info "Starting server..."
  deno task start
}

usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  all       Run full setup (default)"
  echo "  qdrant    Start Qdrant only"
  echo "  ollama    Install Ollama and pull models"
  echo "  ingest    Ingest seed data"
  echo "  start     Start the server"
  echo "  help      Show this help message"
}

main() {
  local cmd="${1:-all}"

  case "$cmd" in
    all)
      info "Running full setup..."
      check_deno
      check_docker
      start_qdrant
      check_ollama
      pull_models
      configure_env
      ingest_data
      start_server
      ;;
    qdrant)
      check_docker
      start_qdrant
      ;;
    ollama)
      check_ollama
      pull_models
      ;;
    ingest)
      check_deno
      ingest_data
      ;;
    start)
      check_deno
      start_server
      ;;
    help|--help|-h)
      usage
      ;;
    *)
      usage
      error "Unknown command: $cmd"
      ;;
  esac
}

main "$@"
