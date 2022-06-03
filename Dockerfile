FROM node:16-stretch

# install gcc
RUN apt-get update \
  && apt-get -y install g++ python \
  && rm /var/lib/apt/lists/* -fR

# Set Env
ENV NODE_ENV=production

# Install Library
RUN mkdir /relay
COPY . /relay
RUN cd /relay \
  && rm -rf node_modules \
  && rm -rf build \
  && npm install

#
WORKDIR /relay
CMD ["npm", "start"]
EXPOSE 3000