FROM node:8-stretch
MAINTAINER gittrname<txgfx504@yahoo.co.jp>

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
  && npm install

#
VOLUME ["/relay/keypair"]
WORKDIR /relay
CMD ["npm", "start"]
EXPOSE 3000