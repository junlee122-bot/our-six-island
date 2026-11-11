#!/usr/bin/env bash
# Keep the runner's Ubuntu trust configuration; bypass only the failing Azure
# mirror before Playwright installs its usual Chromium/system dependencies.
set -euo pipefail

has_ubuntu_fallbacks() {
  awk '
    $1 ~ /^https?:\/\/archive[.]ubuntu[.]com\/ubuntu\/?$/ { archive = 1 }
    $1 ~ /^https?:\/\/security[.]ubuntu[.]com\/ubuntu\/?$/ { security = 1 }
    END { exit !(archive && security) }
  '
}

without_azure_mirror() {
  awk '$1 !~ /^https?:\/\/azure[.]archive[.]ubuntu[.]com\/ubuntu\/?$/ { print }'
}

with_ubuntu_archive_uri() {
  # Match complete URI tokens, including legacy sources without a final slash.
  # Repeat for adjacent URIs; leave suites, components and Signed-By untouched.
  sed -E ':again; s@(^|[[:space:]])https?://azure[.]archive[.]ubuntu[.]com/ubuntu/?([[:space:]]|$)@\1https://archive.ubuntu.com/ubuntu/\2@g; t again'
}

configure_ubuntu_mirrors() {
  local mirrors=/etc/apt/apt-mirrors.txt
  local source updated
  if [[ -f "$mirrors" ]] && grep -Eq '^[[:space:]]*https?://azure[.]archive[.]ubuntu[.]com/ubuntu/?([[:space:]]|$)' "$mirrors"; then
    if ! has_ubuntu_fallbacks < "$mirrors"; then
      echo '::error::Expected official Ubuntu archive/security fallbacks are missing; mirror list was not changed.' >&2
      return 1
    fi
    updated=$(without_azure_mirror < "$mirrors")
    printf '%s\n' "$updated" | sudo tee "$mirrors" > /dev/null
    echo 'Using the existing official Ubuntu archive/security mirror fallbacks.'
  fi
  for source in /etc/apt/sources.list /etc/apt/sources.list.d/ubuntu.sources; do
    [[ -f "$source" ]] || continue
    updated=$(with_ubuntu_archive_uri < "$source")
    if [[ "$updated" != "$(cat "$source")" ]]; then
      printf '%s\n' "$updated" | sudo tee "$source" > /dev/null
      echo "Replaced only the Azure Ubuntu URI in $source."
    fi
  done
}

install_playwright() {
  local attempt status=1
  for attempt in 1 2; do
    if npx playwright-core install --with-deps chromium; then
      return 0
    else
      status=$?
    fi
    if [[ "$attempt" -eq 1 ]]; then
      echo 'Chromium dependency/browser installation failed; retrying once in 5 seconds.' >&2
      sleep 5
    fi
  done
  return "$status"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  configure_ubuntu_mirrors
  install_playwright
fi
