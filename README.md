
## About

> JHipster is a development platform to quickly generate, develop, and deploy modern web applications and microservice architectures. We support many frontend technologies, including Angular, React, and Vue. We even have mobile app support for Ionic and React Native! On the backend, we support Spring Boot (with Java or Kotlin), Micronaut, Quarkus, Node.js, and .NET. For deployment, we embrace cloud native principles with Docker and Kubernetes. Deployment support exists for AWS, Azure, Cloud Foundry, Google Cloud Platform, Heroku, and OpenShift.

Documentation and information about PHipster is available [here](https://www.phipster.dev/)

Full documentation and information about JHipster is available [here](https://www.jhipster.tech/)

---

## Build status

![Angular](https://github.com/jhipster/jhipster-fastapi/workflows/Angular/badge.svg)

![React](https://github.com/jhipster/jhipster-fastapi/workflows/React/badge.svg)

![Webflux](https://github.com/jhipster/jhipster-fastapi/workflows/Webflux/badge.svg)

![Microservices](https://dev.azure.com/jhipster/jhipster-fastapi/_apis/build/status/jhipster.jhipster-fastapi?branchName=main)

![PHipster Generated Applications CI](https://github.com/jhipster/jhipster-fastapi/workflows/PHipster%20Generated%20Applications%20CI/badge.svg)

## Greetings, FastAPI Hipster!

[![NPM version][npm-image]][npm-url]
[![Dependency Status][daviddm-image]][daviddm-url]

This project adds Kotlin to the JHipster application 😎. It is based on JHipster Blueprint 🔵.

### 🚀 How to get started

Install the package with `npm install -g generator-jhipster-fastapi`

1. Make sure you have `yo` installed with `npm install -g yo`
2. Install the package with `npm install -g generator-jhipster-fastapi`
3. Generate the application with `phipster`

### Using Docker

Download the Dockerfile:

```bash
mkdir docker
cd docker
wget https://github.com/jhipster/jhipster-fastapi/raw/main/docker/Dockerfile
```

Build the Docker images:

```bash
docker build -t jhipster-generator-kotlin:latest .
```

Make a folder where you want to generate the Service:

```bash
mkdir service
cd service
```

Run the generator from image to generate service:

```bash
docker run -it --rm -v $PWD:/home/phipster/app jhipster-generator-kotlin
```

Run and attach interactive shell to the generator docker container to work from inside the running container:

```bash
docker run -it --rm -v $PWD:/home/phipster/app jhipster-generator-kotlin /bin/bash
```

### 🚦 What we have now

✅ General App generation - `phipster`

✅ Spring Controller - `phipster spring-controller <controller-name>`

✅ Spring Service - `phipster spring-service <service-name>`

✅ Entity generation - `phipster entity <entity-name>`

### ❤️ for community

Found an issue, let us know [here](https://github.com/jhipster/jhipster-fastapi/issues).

Interested in contributing, check out our [contributing guide](https://github.com/jhipster/jhipster-fastapi/blob/main/CONTRIBUTING.md) to get started.

[npm-image]: https://badge.fury.io/js/generator-jhipster-fastapi.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-fastapi
[daviddm-image]: https://david-dm.org/jhipster/generator-jhipster-fastapi.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/jhipster/generator-jhipster-fastapi
