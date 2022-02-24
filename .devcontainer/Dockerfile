# ======================= #
#  Development container  #
# ======================= #

ARG VARIANT=14-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# Install system packages.
RUN apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get -y install --no-install-recommends \
      gnupg2 \
      fish

# Install global node modules.
RUN su node -c "npm install -g npm aws-cdk"

# Install the AWS CLI.
COPY library-scripts/aws-cli.sh /tmp/library-scripts/
RUN apt-get update && bash /tmp/library-scripts/aws-cli.sh

# Install Docker tools to use Docker (container) from Docker (host).
COPY library-scripts/docker-debian.sh /tmp/library-scripts/
ENV DOCKER_BUILDKIT=1
RUN apt-get update && bash /tmp/library-scripts/docker-debian.sh

# Launch the Docker initialization script.
ENTRYPOINT ["/usr/local/share/docker-init.sh"]

# Keep the container running until Visual Studio Code connects to it.
CMD ["sleep", "infinity"]
