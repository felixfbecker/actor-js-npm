FROM node:8

# add a non-root user and give them ownership
RUN useradd -u 9000 app && \
    # user home directory
    mkdir /home/app && \
    chown -R app:app /home/app && \
    # repo
    mkdir /repo && \
    chown -R app:app /repo && \
    # actor code
    mkdir /usr/src/actor && \
    chown -R app:app /usr/src/actor

ADD package.json /
ADD yarn.lock /
RUN yarn install

# run everything from here on as non-root
USER app

RUN git config --global user.email "bot@dependencies.io"
RUN git config --global user.name "Dependencies.io Bot"

ADD entrypoint.js /usr/src/actor

WORKDIR /repo

ENTRYPOINT ["node", "/usr/src/actor/entrypoint.js"]
