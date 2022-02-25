FROM ubuntu:20.04
RUN \
  # configure the "phipster" user
  groupadd phipster && \
  useradd phipster -s /bin/bash -m -g phipster -G sudo && \
  echo 'phipster:phipster' |chpasswd && \
  mkdir /home/phipster/app && \
  export DEBIAN_FRONTEND=noninteractive && \
  export TZ=Europe\Paris && \
  ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
  apt-get update && \
  # install utilities
  apt-get install -y \
    wget \
    sudo && \
  # install node.js
  wget https://nodejs.org/dist/v14.15.0/node-v14.15.0-linux-x64.tar.gz -O /tmp/node.tar.gz && \
  tar -C /usr/local --strip-components 1 -xzf /tmp/node.tar.gz && \
  # upgrade npm
  npm install -g npm && \
  # install yeoman
  npm install -g yo && \
  # cleanup
  apt-get clean && \
  rm -rf \
    /home/phipster/.cache/ \
    /var/lib/apt/lists/* \
    /tmp/* \
    /var/tmp/*

RUN \
  # install the blueprint
  npm install -g generator-jhipster-fastapi && \
  # fix phipster user permissions
  chown -R phipster:phipster \
    /home/phipster \
    /usr/local/lib/node_modules && \
  # cleanup
  rm -rf \
    /home/phipster/.cache/ \
    /var/lib/apt/lists/* \
    /tmp/* \
    /var/tmp/*

# expose the working directory
USER phipster
ENV PATH $PATH:/usr/bin
WORKDIR "/home/phipster/app"
VOLUME ["/home/phipster/app"]
CMD phipster