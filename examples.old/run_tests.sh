#!/bin/bash

set -e

DIR="$( cd "$(dirname "$0")" ; pwd -P )"

echo "$DIR"

run_example () {
  printf "\n\n===> EXECUTING: $DIR/$1.js <===\n\n"
  node "$DIR/$1.js"
}

run_example "identity"
run_example "metadata"
run_example "limits"
run_example "crud"
run_example "query"
run_example "search"
run_example "single"

