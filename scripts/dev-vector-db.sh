#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.vector.yml"

usage() {
  echo "Usage: $0 {up|down|logs}"
  exit 1
}

if [[ $# -lt 1 ]]; then
  usage
fi

case "$1" in
  up)
    docker compose -f "$COMPOSE_FILE" up -d
    ;;
  down)
    docker compose -f "$COMPOSE_FILE" down
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f
    ;;
  *)
    usage
    ;;
esac
