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

# the non-root user of the base image (uid 1000)
USER node
# the cache volumes of devcontainer.json take the owner of these folders when Docker creates them
RUN mkdir -p /home/node/.npm /home/node/.pnpm-store

# Default port for Node.js
EXPOSE 3000

CMD ["pnpm"]