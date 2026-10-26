FROM node:24

# install gcc
RUN apt-get update \
  && apt-get -y install g++ python3 \
  && rm -rf /var/lib/apt/lists/* -fR

# Install Library
RUN mkdir /relay
COPY . /relay
RUN cd /relay \
  && rm -rf node_modules \
  && rm -rf build \
  && npm install --include=dev --no-fund --no-audit

# Runtime settings
ENV NODE_ENV=development
WORKDIR /relay
CMD ["npm", "start"]
EXPOSE 3000