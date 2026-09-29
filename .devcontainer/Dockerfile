# Docker has specific installation instructions for each operating system.
# Please refer to the official documentation at https://docker.com/get-started/

FROM node:24.20.0-alpine


RUN node -v 
# Should print "v24.20.0".

RUN apk add --no-cache \
    git \
    bash \
    curl \
    openssh-client
RUN npm install -g pnpm npm-check-updates

# Create a working directory
WORKDIR /workspace

# Set up a non-root user

ARG USERNAME=vscode
RUN adduser --disabled-password --gecos "" $USERNAME
USER $USERNAME
# the cache volumes of devcontainer.json take the owner of these folders when Docker creates them
RUN mkdir -p /home/$USERNAME/.npm /home/$USERNAME/.pnpm-store

# Default port for Node.js
EXPOSE 3000

CMD ["pnpm"]