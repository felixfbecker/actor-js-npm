FROM node:7

RUN mkdir /repo

ADD package.json /
ADD yarn.lock /
RUN yarn install

RUN git config --global user.email "bot@dependencies.io"
RUN git config --global user.name "Dependencies.io Bot"

ADD entrypoint.js /

WORKDIR /repo

ENTRYPOINT ["node", "/entrypoint.js"]
