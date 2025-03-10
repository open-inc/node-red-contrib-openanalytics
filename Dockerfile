FROM ubuntu:24.04
USER root
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt update
#RUN apt install -y python3
#RUN apt install -y  python3-pip

ENV NODE_VERSION=20.10.0

RUN apt install -y curl git
ENV NVM_DIR=/root/.nvm
RUN mkdir -p /root/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"

#Node-Red
RUN npm install -g --unsafe-perm node-red
# RUN apt install -y python3.12-venv

#Python with Ludwig
# RUN python3 -m venv ~/venv
# RUN echo 'Cython < 3.0' > /tmp/constraint.txt
# ENV PIP_CONSTRAINT=/tmp/constraint.txt 
# RUN ~/venv/bin/pip3 install 'PyYAML==5.4.1'
# RUN ~/venv/bin/pip3 install ludwig

#RUN npm install -g node-red-contrib-image-output node-red-contrib-image-tools node-red-contrib-teachable-machine node-red-contrib-fs node-red-node-sentiment node-red-contrib-google-translate-extend node-red-contrib-ot-to-status
RUN npm install -g typescript pnpm

WORKDIR /root/nodes/


COPY package.json ./package.json
RUN pnpm install

COPY src/ ./src/
COPY tsconfig.json ./tsconfig.json
COPY rollup.config.editor.mjs ./rollup.config.editor.mjs
COPY tsconfig.runtime.json ./tsconfig.runtime.json
COPY tsconfig.runtime.watch.json ./tsconfig.runtime.watch.json

RUN pnpm build

WORKDIR /root/.node-red/
RUN npm install /root/nodes

# RUN ~/venv/bin/pip3 install ludwig[serve]

COPY node-red-flow.json /root/.node-red/flows.json
COPY settings.js /root/.node-red/settings.js



ENV NODE_RED_ENABLE_PROJECTS=true
ENV PATH="/root/venv/bin:${PATH}"
EXPOSE 1880
WORKDIR /root/venv/

CMD ["node-red"]