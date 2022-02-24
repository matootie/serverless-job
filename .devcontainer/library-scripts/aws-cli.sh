#!/usr/bin/env bash

set -e

# Ensure script is run as root.
if [ "$(id -u)" -ne 0 ]; then
    echo -e 'Script must be run as root. Use sudo, su, or add "USER root" to your Dockerfile before running this script.'
    exit 1
fi

# Function to run apt-get if needed
apt_get_update_if_needed()
{
    if [ ! -d "/var/lib/apt/lists" ] || [ "$(ls /var/lib/apt/lists/ | wc -l)" = "0" ]; then
        echo "Running apt-get update..."
        apt-get update
    else
        echo "Skipping apt-get update."
    fi
}

# Checks if packages are installed and installs them if not
check_packages() {
    if ! dpkg -s "$@" > /dev/null 2>&1; then
        apt_get_update_if_needed
        apt-get -y install --no-install-recommends "$@"
    fi
}

# Ensure apt is in non-interactive to avoid prompts
export DEBIAN_FRONTEND=noninteractive

# Check for dependencies.
check_packages curl wget unzip

# Determine the architecture to know the distributable.
architecture="$(dpkg --print-architecture)"
if [ $architecture = "arm64" ]; then
  dist=aarch64
elif [ $architecture = "amd64" ]; then
  dist=x86_64
fi

# Download the AWS CLI installer.
curl https://awscli.amazonaws.com/awscli-exe-linux-$dist.zip -o /tmp/awscli.zip

# Unzip the AWS CLI installer.
unzip /tmp/awscli.zip -d /tmp

# Run the install script.
sh /tmp/aws/install

# Remove the installer files.
rm -rv /tmp/aws /tmp/awscli.zip
