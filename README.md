# [![Purinton Dev](https://purinton.us/logos/brand.png)](https://discord.gg/QSBxQnX7PF)

## @purinton/updater [![npm version](https://img.shields.io/npm/v/@purinton/updater.svg)](https://www.npmjs.com/package/@purinton/updater)[![license](https://img.shields.io/github/license/purinton/updater.svg)](LICENSE)[![build status](https://github.com/purinton/updater/actions/workflows/nodejs.yml/badge.svg)](https://github.com/purinton/updater/actions)

A Node.js tool for automating system updates and service management across multiple remote Linux servers via SSH. **This tool is specifically designed for Red Hat-based systems (RHEL, CentOS, Fedora, Rocky, Alma, etc.) using `yum` or `dnf`. It is not intended for Debian/Ubuntu systems.** Includes notification support and can be run as a scheduled service.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Customization](#customization)
- [Support](#support)
- [License](#license)

## Features

- Automated yum/dnf update checks and full system updates via SSH (Red Hat-based systems only)
- Service stop/start and verification
- Discord webhook notifications for update status
- Environment variable support via dotenv
- Logging and signal handling via `@purinton/common`
- Jest for testing
- Can be run as a systemd service
- MIT License

> **Note:** This tool is not intended for Debian/Ubuntu systems. It relies on `yum`/`dnf` commands and systemd service management.

## Getting Started

1. **Clone this repository:**

   ```bash
   git clone https://github.com/purinton/updater.git your-project-name
   cd your-project-name
   rm -rf .git
   git init
   npm install
   ```

2. **Configure your servers:**
   - Copy `servers.json.example` to `servers.json` and edit it to list your servers and their managed services:

     ```json
     {
       "user@host1": ["service1", "service2"],
       "user@host2": ["service3"]
     }
     ```

   - Set up your `.env` file as needed for secrets and webhook URLs.

> **Supported OS:** Only Red Hat-based distributions (RHEL, CentOS, Fedora, Rocky, Alma, etc.) with `yum` or `dnf` are supported. Debian/Ubuntu are not supported.

## Usage

- **Check for available updates and send notifications:**

  ```bash
  node check-update.mjs
  ```

  - Checks each server in `servers.json` for available yum updates.
  - Sends a Discord notification if updates are found or if errors occur.

- **Perform full update, reboot, and service verification:**

  ```bash
  node update.mjs
  ```

  - Stops listed services, runs `yum -y update && reboot`, waits for the host to reboot, and verifies services are running again.

- **Run as a service:**
  - Use the provided `check-update.service` file to run update checks on a schedule with systemd.

## Development

- Main entries: `check-update.mjs` (update check/notification), `update.mjs` (full update/reboot cycle)
- Start your app:

  ```bash
  node check-update.mjs
  # or
  node update.mjs
  ```

- Add your code in new files and import as needed.

## Testing

- Run tests with:

  ```bash
  npm test
  ```

- Tests are located in the `tests/` folder.

## Customization

- Extend or replace logging and notification as needed.
- Add dependencies and scripts to fit your project.
- Modify the update or service management logic as required.

## Support

For help or questions, join the community:

[Purinton Dev on Discord](https://discord.gg/QSBxQnX7PF)

## License

[MIT © 2025 Russell Purinton](LICENSE)

## Links

- [GitHub](https://github.com/purinton/updater)
- [Discord](https://discord.gg/QSBxQnX7PF)
