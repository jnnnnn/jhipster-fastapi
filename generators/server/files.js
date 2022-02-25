/**
 * Copyright 2013-2020 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const path = require('path');
// const fs = require('fs');
const serverCleanup = require('generator-jhipster/generators/cleanup');
const constants = require('generator-jhipster/generators/generator-constants');
const baseServerFiles = require('generator-jhipster/generators/server/files').serverFiles;
const cheerio = require('cheerio');

const { GATEWAY, MICROSERVICE, MONOLITH } = require('generator-jhipster/jdl/jhipster/application-types');
const { OAUTH2, SESSION } = require('generator-jhipster/jdl/jhipster/authentication-types');
const { GRADLE, MAVEN } = require('generator-jhipster/jdl/jhipster/build-tool-types');
const { SPRING_WEBSOCKET } = require('generator-jhipster/jdl/jhipster/websocket-types');
const databaseTypes = require('generator-jhipster/jdl/jhipster/database-types');
const { COUCHBASE, MONGODB, NEO4J, SQL } = require('generator-jhipster/jdl/jhipster/database-types');
const { CAFFEINE, EHCACHE, HAZELCAST, INFINISPAN, MEMCACHED, REDIS } = require('generator-jhipster/jdl/jhipster/cache-types');
const { KAFKA } = require('generator-jhipster/jdl/jhipster/message-broker-types');
// const { addSectionsCondition, mergeSections } = require('generator-jhipster/generators/utils');
const fastapiConstants = require('../generator-fastapi-constants');
const { writeCouchbaseFiles } = require('./files-couchbase');
const { writeSqlFiles } = require('./files-sql');

/* Constants use throughout */
const NO_DATABASE = databaseTypes.NO;
const INTERPOLATE_REGEX = constants.INTERPOLATE_REGEX;
const SERVER_MAIN_SRC_DIR = constants.SERVER_MAIN_SRC_DIR;
const SERVER_MAIN_FASTAPI_SRC_DIR = `${constants.MAIN_DIR}fastapi/`;
const SERVER_TEST_SRC_FASTAPI_DIR = `${constants.TEST_DIR}fastapi/`;
const SERVER_MAIN_RES_DIR = constants.SERVER_MAIN_RES_DIR;
const SERVER_TEST_SRC_DIR = constants.SERVER_TEST_SRC_DIR;
const SERVER_TEST_RES_DIR = constants.SERVER_TEST_RES_DIR;
const TEST_DIR = constants.TEST_DIR;

// TODO: Do a PR in the parent JHipster project to export and re-use here as well in order to have a single source of truth!!!
const shouldSkipUserManagement = generator =>
    generator.skipUserManagement && (generator.applicationType !== MONOLITH || generator.authenticationType !== OAUTH2);

/**
 * The default is to use a file path string. It implies use of the template method.
 * For any other config an object { file:.., method:.., template:.. } can be used
 */
const serverFiles = {
    ...baseServerFiles,
    serverBuild: [
        ...baseServerFiles.serverBuild,
        {
            condition: generator => generator.buildTool === GRADLE,
            templates: [{ file: 'gradle/fastapi.gradle', useBluePrint: true }],
        },
        {
            templates: [{ file: `${fastapiConstants.DETEKT_CONFIG_FILE}`, useBluePrint: true }],
        },
    ],
    serverResource: [
        {
            condition: generator => generator.devDatabaseTypeH2Any,
            path: SERVER_MAIN_RES_DIR,
            templates: [{ file: 'h2.server.properties', renameTo: () => '.h2.server.properties' }],
        },
        {
            condition: generator => generator.databaseTypeSql,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    override: generator =>
                        !generator.jhipsterConfig.incrementalChangelog || generator.configOptions.recreateInitialChangelog,
                    file: 'config/liquibase/changelog/initial_schema.xml',
                    renameTo: () => 'config/liquibase/changelog/00000000000000_initial_schema.xml',
                    options: { interpolate: INTERPOLATE_REGEX },
                },
                {
                    override: generator =>
                        !generator.jhipsterConfig.incrementalChangelog || generator.configOptions.recreateInitialChangelog,
                    file: 'config/liquibase/master.xml',
                },
            ],
        },
        {
            condition: generator => generator.databaseTypeCassandra,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                'config/cql/create-keyspace-prod.cql',
                'config/cql/create-keyspace.cql',
                'config/cql/drop-keyspace.cql',
                { file: 'config/cql/changelog/README.md', method: 'copy' },
            ],
        },
        {
            condition: generator =>
                generator.databaseTypeCassandra &&
                generator.applicationType !== MICROSERVICE &&
                (!generator.skipUserManagement || generator.authenticationType === OAUTH2),
            path: SERVER_MAIN_RES_DIR,
            templates: [
                { file: 'config/cql/changelog/create-tables.cql', renameTo: () => 'config/cql/changelog/00000000000000_create-tables.cql' },
                {
                    file: 'config/cql/changelog/insert_default_users.cql',
                    renameTo: () => 'config/cql/changelog/00000000000001_insert_default_users.cql',
                },
            ],
        },
        {
            condition: generator =>
                generator.databaseType === MONGODB &&
                (!generator.skipUserManagement || (generator.skipUserManagement && generator.authenticationType === OAUTH2)),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/dbmigrations/InitialSetupMigration.kt',
                    renameTo: generator => `${generator.javaDir}config/dbmigrations/InitialSetupMigration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.databaseType === NEO4J && (!generator.skipUserManagement || generator.authenticationType === OAUTH2),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/neo4j/Neo4jMigrations.kt',
                    renameTo: generator => `${generator.javaDir}config/neo4j/Neo4jMigrations.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.databaseType === NEO4J && (!generator.skipUserManagement || generator.authenticationType === OAUTH2),
            path: SERVER_MAIN_RES_DIR,
            templates: ['config/neo4j/migrations/user__admin.json', 'config/neo4j/migrations/user__user.json'],
        },
        {
            path: SERVER_MAIN_RES_DIR,
            templates: [
                {
                    file: 'banner.txt',
                    method: 'copy',
                    noEjs: true,
                    renameTo: () => 'banner.txt',
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !!generator.enableSwaggerCodegen,
            path: SERVER_MAIN_RES_DIR,
            templates: ['swagger/api.yml'],
        },
        {
            path: SERVER_MAIN_RES_DIR,
            templates: [
                // Thymeleaf templates
                { file: 'templates/error.html', method: 'copy' },
                'logback-spring.xml',
                'config/application.yml',
                'config/application-dev.yml',
                'config/application-tls.yml',
                'config/application-prod.yml',
                'i18n/messages.properties',
            ],
        },
    ],
    serverJavaAuthConfig: [
        {
            condition: generator =>
                !generator.reactive &&
                (generator.databaseTypeSql || generator.databaseType === MONGODB || generator.databaseType === COUCHBASE),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/SpringSecurityAuditorAware.kt',
                    renameTo: generator => `${generator.javaDir}security/SpringSecurityAuditorAware.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/SecurityUtils.kt',
                    renameTo: generator => `${generator.javaDir}security/SecurityUtils.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/AuthoritiesConstants.kt',
                    renameTo: generator => `${generator.javaDir}security/AuthoritiesConstants.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/security/SecurityUtilsUnitTest.kt',
                    renameTo: generator => `${generator.testDir}security/SecurityUtilsUnitTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeJwt,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/jwt/TokenProvider.kt',
                    renameTo: generator => `${generator.javaDir}security/jwt/TokenProvider.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/jwt/JWTFilter.kt',
                    renameTo: generator => `${generator.javaDir}security/jwt/JWTFilter.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/management/SecurityMetersService.kt',
                    renameTo: generator => `${generator.javaDir}management/SecurityMetersService.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeJwt && !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/jwt/JWTConfigurer.kt',
                    renameTo: generator => `${generator.javaDir}security/jwt/JWTConfigurer.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.reactive && generator.applicationTypeGateway && generator.authenticationTypeJwt,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/jwt/JWTRelayGatewayFilterFactory.kt',
                    renameTo: generator => `${generator.testDir}security/jwt/JWTRelayGatewayFilterFactory.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/SecurityConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/SecurityConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/SecurityConfiguration_reactive.kt',
                    renameTo: generator => `${generator.javaDir}config/SecurityConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !shouldSkipUserManagement(generator) && generator.authenticationTypeSession && !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/PersistentTokenRememberMeServices.kt',
                    renameTo: generator => `${generator.javaDir}security/PersistentTokenRememberMeServices.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/domain/PersistentToken.kt',
                    renameTo: generator => `${generator.javaDir}domain/PersistentToken.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                !shouldSkipUserManagement(generator) &&
                generator.authenticationType === SESSION &&
                !generator.reactive &&
                generator.databaseType !== COUCHBASE,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/repository/PersistentTokenRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/PersistentTokenRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/oauth2/AudienceValidator.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/AudienceValidator.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/oauth2/JwtGrantedAuthorityConverter.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/JwtGrantedAuthorityConverter.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/oauth2/OAuthIdpTokenResponseDTO.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/OAuthIdpTokenResponseDTO.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/security/oauth2/AudienceValidatorTest.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/AudienceValidatorTest.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/TestSecurityConfiguration.kt',
                    renameTo: generator => `${generator.testDir}config/TestSecurityConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                !generator.reactive &&
                generator.authenticationTypeOauth2 &&
                (generator.applicationTypeMicroservice || generator.applicationTypeGateway),
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/security/oauth2/AuthorizationHeaderUtilTest.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/AuthorizationHeaderUtilTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !shouldSkipUserManagement(generator) && generator.authenticationType !== OAUTH2,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/DomainUserDetailsService.kt',
                    renameTo: generator => `${generator.javaDir}security/DomainUserDetailsService.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/UserNotActivatedException.kt',
                    renameTo: generator => `${generator.javaDir}security/UserNotActivatedException.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.applicationType !== MICROSERVICE && generator.authenticationTypeJwt,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/vm/LoginVM.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/vm/LoginVM.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/UserJWTController.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/UserJWTController.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !!generator.enableSwaggerCodegen,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/OpenApiConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/OpenApiConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.reactive && generator.authenticationTypeOauth2 && generator.applicationType === MONOLITH,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/oauth2/CustomClaimConverter.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/CustomClaimConverter.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.reactive && generator.authenticationTypeOauth2 && generator.applicationType === MONOLITH,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/security/oauth2/CustomClaimConverterIT.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/CustomClaimConverterIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaGateway: [
        {
            condition: generator => generator.applicationTypeGateway && generator.serviceDiscoveryType,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/vm/RouteVM.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/vm/RouteVM.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/GatewayResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/GatewayResource.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.authenticationTypeOauth2 && (generator.applicationType === MONOLITH || generator.applicationTypeGateway),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/AuthInfoResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/AuthInfoResource.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/LogoutResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/LogoutResource.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.applicationTypeGateway && generator.serviceDiscoveryType && generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/filter/ModifyServersOpenApiFilter.kt',
                    renameTo: generator => `${generator.javaDir}web/filter/ModifyServersOpenApiFilter.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.applicationTypeGateway && generator.serviceDiscoveryType && generator.reactive,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/filter/ModifyServersOpenApiFilterTest.kt',
                    renameTo: generator => `${generator.testDir}web/filter/ModifyServersOpenApiFilterTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverMicroservice: [
        {
            condition: generator =>
                !generator.reactive &&
                (generator.applicationTypeMicroservice || generator.applicationTypeGateway) &&
                generator.authenticationTypeJwt,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/FeignConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/FeignConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/client/JWT_UserFeignClientInterceptor.kt',
                    renameTo: generator => `${generator.javaDir}client/UserFeignClientInterceptor.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                !generator.reactive &&
                generator.authenticationTypeOauth2 &&
                (generator.applicationTypeMicroservice || generator.applicationTypeGateway),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/security/oauth2/AuthorizationHeaderUtil.kt',
                    renameTo: generator => `${generator.javaDir}security/oauth2/AuthorizationHeaderUtil.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/FeignConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/FeignConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/client/AuthorizedFeignClient.kt',
                    renameTo: generator => `${generator.javaDir}client/AuthorizedFeignClient.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/client/OAuth2InterceptedFeignConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}client/OAuth2InterceptedFeignConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/client/TokenRelayRequestInterceptor.kt',
                    renameTo: generator => `${generator.javaDir}client/TokenRelayRequestInterceptor.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.reactive && generator.applicationTypeGateway && !generator.serviceDiscoveryType,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/RestTemplateConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/RestTemplateConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.applicationTypeMicroservice,
            path: SERVER_MAIN_RES_DIR,
            templates: [{ file: 'static/microservices_index.html', renameTo: () => 'static/index.html' }],
        },
    ],
    ...baseServerFiles.serverResource.serverMicroserviceAndGateway,
    serverJavaApp: [
        {
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/Application.kt',
                    renameTo: generator => `${generator.javaDir}${generator.mainClass}.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/ApplicationWebXml.kt',
                    renameTo: generator => `${generator.javaDir}ApplicationWebXml.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/ArchTest.kt',
                    renameTo: generator => `${generator.testDir}ArchTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/IntegrationTest.kt',
                    renameTo: generator => `${generator.testDir}/IntegrationTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        // {
        //     path: SERVER_MAIN_FASTAPI_SRC_DIR,
        //     templates: [
        //         {
        //             file: 'package/GeneratedByJHipster.kt',
        //             renameTo: generator => `${generator.javaDir}GeneratedByJHipster.kt`,
        //             useBluePrint: true,
        //         },
        //     ],
        // },
    ],
    serverJavaConfig: [
        {
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/aop/logging/LoggingAspect.kt',
                    renameTo: generator => `${generator.javaDir}aop/logging/LoggingAspect.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/AsyncConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/AsyncConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/DateTimeFormatConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/DateTimeFormatConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/LoggingConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/LoggingConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/ApplicationProperties.kt',
                    renameTo: generator => `${generator.javaDir}config/ApplicationProperties.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/JacksonConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/JacksonConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/LocaleConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/LocaleConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/LoggingAspectConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/LoggingAspectConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/WebConfigurer.kt',
                    renameTo: generator => `${generator.javaDir}config/WebConfigurer.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipClient && !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/StaticResourcesWebConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/StaticResourcesWebConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement || [SQL, MONGODB, COUCHBASE, NEO4J].includes(generator.databaseType),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/Constants.kt',
                    renameTo: generator => `${generator.javaDir}config/Constants.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/ReactorConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/ReactorConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                [EHCACHE, CAFFEINE, HAZELCAST, INFINISPAN, MEMCACHED, REDIS].includes(generator.cacheProvider) ||
                generator.applicationTypeGateway,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/CacheConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/CacheConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.cacheProvider === INFINISPAN,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/CacheFactoryConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/CacheFactoryConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.cacheProviderRedis,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/RedisTestContainerExtension.kt',
                    renameTo: generator => `${generator.testDir}RedisTestContainerExtension.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.databaseType !== NO_DATABASE,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: generator => `package/config/DatabaseConfiguration_${generator.jhipsterConfig.databaseType}.kt`,
                    renameTo: generator => `${generator.javaDir}config/DatabaseConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.databaseTypeSql,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/LiquibaseConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/LiquibaseConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.databaseTypeSql && generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/service/ColumnConverter.kt',
                    renameTo: generator => `${generator.javaDir}service/ColumnConverter.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/EntityManager.kt',
                    renameTo: generator => `${generator.javaDir}service/EntityManager.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.databaseType === SQL &&
                generator.reactive &&
                (!generator.skipUserManagement || generator.authenticationType === OAUTH2),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/repository/rowmapper/UserRowMapper.kt',
                    renameTo: generator => `${generator.javaDir}repository/rowmapper/UserRowMapper.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.websocket === SPRING_WEBSOCKET,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/WebsocketConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/WebsocketConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/WebsocketSecurityConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/WebsocketSecurityConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.searchEngineElasticsearch,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/ElasticsearchConfiguration.kt',
                    renameTo: generator => `${generator.javaDir}config/ElasticsearchConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaDomain: [
        {
            condition: generator => [SQL, MONGODB, NEO4J, COUCHBASE].includes(generator.databaseType),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/domain/AbstractAuditingEntity.kt',
                    renameTo: generator => `${generator.javaDir}domain/AbstractAuditingEntity.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaPackageInfo: [],
    serverJavaServiceError: [
        {
            condition: generator => !generator.skipUserManagement,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/service/EmailAlreadyUsedException.kt',
                    renameTo: generator => `${generator.javaDir}service/EmailAlreadyUsedException.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/InvalidPasswordException.kt',
                    renameTo: generator => `${generator.javaDir}service/InvalidPasswordException.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/UsernameAlreadyUsedException.kt',
                    renameTo: generator => `${generator.javaDir}service/UsernameAlreadyUsedException.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaService: [
        {
            condition: generator => generator.messageBroker === KAFKA,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/KafkaProperties.kt',
                    renameTo: generator => `${generator.javaDir}config/KafkaProperties.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaWebError: [
        {
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/errors/BadRequestAlertException.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/BadRequestAlertException.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/ErrorConstants.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/ErrorConstants.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/ExceptionTranslator.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/ExceptionTranslator.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/FieldErrorVM.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/FieldErrorVM.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/errors/EmailAlreadyUsedException.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/EmailAlreadyUsedException.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/InvalidPasswordException.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/InvalidPasswordException.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/LoginAlreadyUsedException.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/errors/LoginAlreadyUsedException.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaWeb: [
        {
            condition: generator => !generator.skipClient && !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/ClientForwardController.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/ClientForwardController.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipClient && generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/filter/SpaWebFilter.kt',
                    renameTo: generator => `${generator.javaDir}web/filter/SpaWebFilter.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.messageBroker === KAFKA,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/KafkaResource.kt',
                    renameTo: generator =>
                        `${generator.javaDir}web/rest/${generator.upperFirstCamelCase(generator.baseName)}KafkaResource.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaWebsocket: [
        {
            condition: generator => generator.websocket === SPRING_WEBSOCKET,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/websocket/ActivityService.kt',
                    renameTo: generator => `${generator.javaDir}web/websocket/ActivityService.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/websocket/dto/ActivityDTO.kt',
                    renameTo: generator => `${generator.javaDir}web/websocket/dto/ActivityDTO.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverTestReactive: [
        {
            condition: generator => generator.reactive,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/config/JHipsterBlockHoundIntegration.kt',
                    renameTo: generator => `${generator.testDir}config/JHipsterBlockHoundIntegration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.reactive,
            path: SERVER_TEST_RES_DIR,
            templates: ['META-INF/services/reactor.blockhound.integration.BlockHoundIntegration'],
        },
    ],
    springBootOauth2: [
        {
            condition: generator => generator.authenticationTypeOauth2 && generator.applicationTypeMonolith,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/OAuth2Configuration.kt',
                    renameTo: generator => `${generator.javaDir}config/OAuth2Configuration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2 && !generator.applicationTypeMicroservice,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: generator => `package/web/filter/OAuth2${generator.reactive ? 'Reactive' : ''}RefreshTokensWebFilter.kt`,
                    renameTo: generator =>
                        `${generator.javaDir}web/filter/OAuth2${generator.reactive ? 'Reactive' : ''}RefreshTokensWebFilter.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2 && !generator.applicationTypeMicroservice,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/test/util/OAuth2TestUtil.kt',
                    renameTo: generator => `${generator.testDir}test/util/OAuth2TestUtil.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverTestFw: [
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            condition: generator => generator.databaseTypeNeo4j,
            templates: [
                {
                    file: 'package/AbstractNeo4jIT.kt',
                    renameTo: generator => `${generator.testDir}/AbstractNeo4jIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            condition: generator => generator.databaseTypeCassandra,
            templates: [
                {
                    file: 'package/CassandraKeyspaceIT.kt',
                    renameTo: generator => `${generator.testDir}CassandraKeyspaceIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/AbstractCassandraTest.kt',
                    renameTo: generator => `${generator.testDir}AbstractCassandraTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/TestUtil.kt',
                    renameTo: generator => `${generator.testDir}web/rest/TestUtil.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/ExceptionTranslatorIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/errors/ExceptionTranslatorIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/errors/ExceptionTranslatorTestController.kt',
                    renameTo: generator => `${generator.testDir}web/rest/errors/ExceptionTranslatorTestController.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipClient && !generator.reactive,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/ClientForwardControllerTest.kt',
                    renameTo: generator => `${generator.testDir}web/rest/ClientForwardControllerTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.databaseTypeSql && !generator.reactive,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/config/timezone/HibernateTimeZoneIT.kt',
                    renameTo: generator => `${generator.testDir}config/timezone/HibernateTimeZoneIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/repository/timezone/DateTimeWrapper.kt',
                    renameTo: generator => `${generator.testDir}repository/timezone/DateTimeWrapper.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/repository/timezone/DateTimeWrapperRepository.kt',
                    renameTo: generator => `${generator.testDir}repository/timezone/DateTimeWrapperRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_RES_DIR,
            templates: ['config/application.yml', 'logback.xml'],
        },
        {
            condition: generator => generator.databaseTypeSql && !generator.reactive,
            path: SERVER_TEST_RES_DIR,
            templates: ['config/application-testcontainers.yml'],
        },
        {
            condition: generator => generator.prodDatabaseTypeMariadb && !generator.reactive,
            path: SERVER_TEST_RES_DIR,
            templates: [{ file: 'testcontainers/mariadb/my.cnf', method: 'copy', noEjs: true }],
        },
        {
            condition: generator => generator.reactiveSqlTestContainers,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/ReactiveSqlTestContainerExtension.kt',
                    renameTo: generator => `${generator.testDir}ReactiveSqlTestContainerExtension.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            // TODO : add these tests to reactive
            condition: generator => !generator.reactive,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/config/WebConfigurerTest.kt',
                    renameTo: generator => `${generator.testDir}config/WebConfigurerTest.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/WebConfigurerTestController.kt',
                    renameTo: generator => `${generator.testDir}config/WebConfigurerTestController.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            // TODO : add these tests to reactive
            condition: generator => !generator.skipClient && !generator.reactive,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/config/StaticResourcesWebConfigurerTest.kt',
                    renameTo: generator => `${generator.testDir}config/StaticResourcesWebConfigurerTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.serviceDiscoveryType,
            path: SERVER_TEST_RES_DIR,
            templates: ['config/bootstrap.yml'],
        },
        {
            condition: generator =>
                generator.authenticationTypeOauth2 && (generator.applicationType === MONOLITH || generator.applicationTypeGateway),
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/LogoutResourceIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/LogoutResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.gatlingTests,
            path: TEST_DIR,
            templates: [
                // Create Gatling test files
                'gatling/conf/gatling.conf',
                'gatling/conf/logback.xml',
            ],
        },
        {
            condition: generator => generator.cucumberTests,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                // Create Cucumber test files
                {
                    file: 'package/cucumber/CucumberIT.kt',
                    renameTo: generator => `${generator.testDir}cucumber/CucumberIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/cucumber/stepdefs/StepDefs.kt',
                    useBluePrint: true,
                    renameTo: generator => `${generator.testDir}cucumber/stepdefs/StepDefs.kt`,
                },
                {
                    file: 'package/cucumber/CucumberTestContextConfiguration.kt',
                    renameTo: generator => `${generator.testDir}cucumber/CucumberTestContextConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.cucumberTests,
            path: SERVER_TEST_RES_DIR,
            templates: [
                'junit-platform.properties',
                { file: 'package/features/gitkeep', renameTo: generator => `${generator.testDir}cucumber/gitkeep`, noEjs: true },
            ],
        },
        {
            condition: generator => !shouldSkipUserManagement(generator) && generator.authenticationType !== OAUTH2,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                // Create auth config test files
                {
                    file: 'package/security/DomainUserDetailsServiceIT.kt',
                    renameTo: generator => `${generator.testDir}security/DomainUserDetailsServiceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.messageBroker === KAFKA,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/KafkaResourceIT.kt',
                    renameTo: generator =>
                        `${generator.testDir}web/rest/${generator.upperFirstCamelCase(generator.baseName)}KafkaResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverJavaUserManagement: [
        {
            condition: generator => generator.isUsingBuiltInUser(),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/domain/User.kt',
                    renameTo: generator => `${generator.javaDir}domain/${generator.asEntity('User')}.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.isUsingBuiltInAuthority(),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/domain/Authority.kt',
                    renameTo: generator => `${generator.javaDir}domain/Authority.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/repository/AuthorityRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/AuthorityRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                (generator.authenticationTypeOauth2 && generator.applicationType !== MICROSERVICE) ||
                (!generator.skipUserManagement && generator.databaseTypeSql),
            path: SERVER_MAIN_RES_DIR,
            templates: ['config/liquibase/data/user.csv'],
        },
        {
            condition: generator =>
                (generator.authenticationTypeOauth2 && generator.applicationType !== MICROSERVICE && generator.databaseTypeSql) ||
                (!generator.skipUserManagement && generator.databaseTypeSql),
            path: SERVER_MAIN_RES_DIR,
            templates: ['config/liquibase/data/authority.csv', 'config/liquibase/data/user_authority.csv'],
        },
        {
            condition: generator => generator.authenticationTypeOauth2,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/Constants.kt',
                    renameTo: generator => `${generator.javaDir}config/Constants.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/UserService.kt',
                    renameTo: generator => `${generator.javaDir}service/UserService.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/dto/AdminUserDTO.kt',
                    renameTo: generator => `${generator.javaDir}service/dto/${generator.asDto('AdminUser')}.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/dto/UserDTO.kt',
                    renameTo: generator => `${generator.javaDir}service/dto/${generator.asDto('User')}.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2 && generator.databaseType !== 'no',
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/service/mapper/UserMapper.kt',
                    renameTo: generator => `${generator.javaDir}service/mapper/UserMapper.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/repository/UserRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/UserRepository.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/UserResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/UserResource.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/PublicUserResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/PublicUserResource.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/vm/ManagedUserVM.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/vm/ManagedUserVM.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.skipUserManagement && [MONOLITH, GATEWAY].includes(generator.applicationType),
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/web/rest/AccountResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/AccountResource.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/service/UserServiceIT.kt',
                    renameTo: generator => `${generator.testDir}service/UserServiceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2 && generator.databaseType !== 'no',
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/service/mapper/UserMapperTest.kt',
                    renameTo: generator => `${generator.testDir}service/mapper/UserMapperTest.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/PublicUserResourceIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/PublicUserResourceIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/UserResourceIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/UserResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.skipUserManagement &&
                generator.authenticationType !== OAUTH2 &&
                [MONOLITH, GATEWAY].includes(generator.applicationType),
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/AccountResourceIT_skipUserManagement.kt',
                    renameTo: generator => `${generator.testDir}web/rest/AccountResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.skipUserManagement &&
                generator.authenticationTypeOauth2 &&
                [MONOLITH, GATEWAY].includes(generator.applicationType),
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/AccountResourceIT_oauth2.kt',
                    renameTo: generator => `${generator.testDir}web/rest/AccountResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator =>
                generator.skipUserManagement &&
                generator.authenticationTypeOauth2 &&
                [MONOLITH, GATEWAY].includes(generator.applicationType),
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/AccountResourceIT_oauth2.kt',
                    renameTo: generator => `${generator.testDir}web/rest/AccountResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2 && generator.searchEngineElasticsearch,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/repository/search/UserSearchRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/search/UserSearchRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeOauth2 && generator.searchEngineElasticsearch,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/repository/search/UserSearchRepositoryMockConfiguration.kt',
                    renameTo: generator => `${generator.testDir}repository/search/UserSearchRepositoryMockConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                'templates/mail/activationEmail.html',
                'templates/mail/creationEmail.html',
                'templates/mail/passwordResetEmail.html',
            ],
        },
        {
            condition: generator => !generator.skipUserManagement,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                /* User management java domain files */
                {
                    file: 'package/repository/UserRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/UserRepository.kt`,
                    useBluePrint: true,
                },

                /* User management java service files */
                {
                    file: 'package/service/UserService.kt',
                    renameTo: generator => `${generator.javaDir}service/UserService.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/MailService.kt',
                    renameTo: generator => `${generator.javaDir}service/MailService.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/dto/AdminUserDTO.kt',
                    renameTo: generator => `${generator.javaDir}service/dto/${generator.asDto('AdminUser')}.kt`,
                    useBluePrint: true,
                },

                /* User management java web files */
                {
                    file: 'package/service/dto/UserDTO.kt',
                    renameTo: generator => `${generator.javaDir}service/dto/${generator.asDto('User')}.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/dto/PasswordChangeDTO.kt',
                    renameTo: generator => `${generator.javaDir}service/dto/PasswordChangeDTO.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/vm/ManagedUserVM.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/vm/ManagedUserVM.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/AccountResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/AccountResource.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/UserResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/UserResource.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/PublicUserResource.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/PublicUserResource.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/vm/KeyAndPasswordVM.kt',
                    renameTo: generator => `${generator.javaDir}web/rest/vm/KeyAndPasswordVM.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/mapper/UserMapper.kt',
                    renameTo: generator => `${generator.javaDir}service/mapper/UserMapper.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && generator.searchEngineElasticsearch,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/repository/search/UserSearchRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/search/UserSearchRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && generator.searchEngineElasticsearch,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/repository/search/UserSearchRepositoryMockConfiguration.kt',
                    renameTo: generator => `${generator.testDir}repository/search/UserSearchRepositoryMockConfiguration.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.authenticationTypeJwt,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/management/SecurityMetersServiceTests.kt',
                    renameTo: generator => `${generator.testDir}management/SecurityMetersServiceTests.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/jwt/TokenProviderTest.kt',
                    renameTo: generator => `${generator.testDir}security/jwt/TokenProviderTest.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/jwt/TokenProviderSecurityMetersTests.kt',
                    renameTo: generator => `${generator.testDir}security/jwt/TokenProviderSecurityMetersTests.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/security/jwt/JWTFilterTest.kt',
                    renameTo: generator => `${generator.testDir}security/jwt/JWTFilterTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.applicationType !== MICROSERVICE && generator.authenticationTypeJwt,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/UserJWTControllerIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/UserJWTControllerIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && generator.cucumberTests,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/cucumber/stepdefs/UserStepDefs.kt',
                    renameTo: generator => `${generator.testDir}cucumber/stepdefs/UserStepDefs.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && generator.cucumberTests,
            path: SERVER_TEST_RES_DIR,
            templates: [
                {
                    file: 'package/features/user/user.feature',
                    renameTo: generator => `${generator.testDir}cucumber/user.feature`,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement,
            path: SERVER_TEST_RES_DIR,
            templates: [
                /* User management java test files */
                'templates/mail/testEmail.html',
                'i18n/messages_en.properties',
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && !generator.enableTranslation,
            path: SERVER_TEST_RES_DIR,
            templates: ['i18n/messages_en.properties'],
        },
        {
            condition: generator => !generator.skipUserManagement,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/service/MailServiceIT.kt',
                    renameTo: generator => `${generator.testDir}service/MailServiceIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/UserServiceIT.kt',
                    renameTo: generator => `${generator.testDir}service/UserServiceIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/service/mapper/UserMapperTest.kt',
                    renameTo: generator => `${generator.testDir}service/mapper/UserMapperTest.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/NoOpMailConfiguration.kt',
                    renameTo: generator => `${generator.testDir}config/NoOpMailConfiguration.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/PublicUserResourceIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/PublicUserResourceIT.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/web/rest/UserResourceIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/UserResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && generator.authenticationType !== OAUTH2,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/AccountResourceIT.kt',
                    renameTo: generator => `${generator.testDir}web/rest/AccountResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !generator.skipUserManagement && generator.authenticationTypeOauth2,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/AccountResourceIT_oauth2.kt',
                    renameTo: generator => `${generator.testDir}web/rest/AccountResourceIT.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/web/rest/WithUnauthenticatedMockUser.kt',
                    renameTo: generator => `${generator.testDir}web/rest/WithUnauthenticatedMockUser.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
};

/* eslint-disable no-template-curly-in-string */
function writeFiles() {
    return {
        setUp() {
            this.javaDir = `${this.packageFolder}/`;
            this.testDir = `${this.packageFolder}/`;

            this.generateKeyStore();
        },

        cleanupOldServerFiles() {
            serverCleanup.cleanupOldServerFiles(
                this,
                `${SERVER_MAIN_SRC_DIR}/${this.javaDir}`,
                `${SERVER_TEST_SRC_DIR}/${this.testDir}`,
                SERVER_MAIN_RES_DIR,
                SERVER_TEST_RES_DIR
            );
        },

        writeFiles() {
            return this.writeFilesToDisk(serverFiles);
        },

        ...writeCouchbaseFiles(),

        ...writeSqlFiles(),

        modifyFiles() {
            if (this.buildTool === GRADLE) {
                this.addGradleProperty('fastapi_version', fastapiConstants.FASTAPI_VERSION);
                this.addGradleProperty('mapstruct_version', fastapiConstants.MAPSTRUCT_VERSION);
                this.addGradleProperty('detekt_version', fastapiConstants.DETEKT_VERSION);
                this.addGradlePlugin('org.jetbrains.fastapi', 'fastapi-gradle-plugin', '${fastapi_version}');
                this.addGradlePlugin('org.jetbrains.fastapi', 'fastapi-allopen', '${fastapi_version}');
                if (this.databaseTypeSql) {
                    this.addGradlePlugin('org.jetbrains.fastapi', 'fastapi-noarg', '${fastapi_version}');
                }
                this.addGradlePlugin('org.jlleitschuh.gradle', 'ktlint-gradle', fastapiConstants.KTLINT_GRADLE_VERSION);
                this.addGradlePlugin('io.gitlab.arturbosch.detekt', 'detekt-gradle-plugin', '${detekt_version}');

                this.applyFromGradleScript('gradle/fastapi');
            }

            if (this.buildTool === MAVEN) {
                this.addMavenProperty('fastapi.version', fastapiConstants.FASTAPI_VERSION);
                this.addMavenProperty('mapstruct.version', fastapiConstants.MAPSTRUCT_VERSION);
                this.addMavenProperty('ktlint-maven-plugin.version', fastapiConstants.KTLINT_MAVEN_VERSION);
                this.addMavenProperty('maven-antrun-plugin.version', fastapiConstants.MAVEN_ANTRUN_VERSION);
                this.addMavenProperty('detekt.version', fastapiConstants.DETEKT_VERSION);
                this.addMavenProperty('detekt.configFile', `$\{project.basedir}/${fastapiConstants.DETEKT_CONFIG_FILE}`);
                this.addMavenProperty('detekt.xmlReportFile', '${project.build.directory}/detekt-reports/detekt.xml');
                this.addMavenProperty('sonar.fastapi.detekt.reportPaths', '${detekt.xmlReportFile}');
                this.addMavenProperty('sonar.coverage.jacoco.xmlReportPaths', '${jacoco.reportFolder}/jacoco.xml');

                this.addMavenDependencyManagement('org.jetbrains.fastapi', 'fastapi-stdlib', '${fastapi.version}');
                this.addMavenDependencyManagement('org.jetbrains.fastapi', 'fastapi-stdlib-jdk8', '${fastapi.version}');

                this.addMavenDependency('org.jetbrains.fastapix', 'fastapix-coroutines-debug');
                this.addMavenDependency('org.jetbrains.fastapix', 'fastapix-coroutines-reactor');
                this.addMavenDependency('io.projectreactor.fastapi', 'reactor-fastapi-extensions');

                this.addMavenDependency('com.fasterxml.jackson.datatype', 'jackson-datatype-json-org');
                this.addMavenDependency('org.jetbrains.fastapi', 'fastapi-stdlib-jdk8', '${fastapi.version}');
                this.addMavenDependency('org.jetbrains.fastapi', 'fastapi-reflect', '${fastapi.version}');
                this.addMavenDependency(
                    'org.jetbrains.fastapi',
                    'fastapi-test-junit',
                    '${fastapi.version}',
                    '            <scope>test</scope>'
                );
                this.addMavenDependency(
                    'com.nhaarman.mockitofastapi2',
                    'mockito-fastapi',
                    fastapiConstants.MOCKITO_FASTAPI_VERSION,
                    '            <scope>test</scope>'
                );
                // NOTE: Add proper indentation of the configuration tag
                const fastapiOther = `                <executions>
                    <execution>
                        <id>kapt</id>
                        <goals>
                            <goal>kapt</goal>
                        </goals>
                        <configuration>
                            <sourceDirs>
                                <sourceDir>$\{project.basedir}/src/main/fastapi</sourceDir>
                                <sourceDir>$\{project.basedir}/src/main/java</sourceDir>
                            </sourceDirs>
                            <annotationProcessorPaths>
                                <annotationProcessorPath>
                                    <groupId>org.mapstruct</groupId>
                                    <artifactId>mapstruct-processor</artifactId>
                                    <version>$\{mapstruct.version}</version>
                                </annotationProcessorPath>
                                ${
                                    this.databaseTypeSql
                                        ? `<!-- For JPA static metamodel generation -->
                                <annotationProcessorPath>
                                    <groupId>org.hibernate</groupId>
                                    <artifactId>hibernate-jpamodelgen</artifactId>
                                    <version>$\{hibernate.version}</version>
                                </annotationProcessorPath>
                                <annotationProcessorPath>
                                    <groupId>org.glassfish.jaxb</groupId>
                                    <artifactId>jaxb-runtime</artifactId>
                                    <version>$\{jaxb-runtime.version}</version>
                                </annotationProcessorPath>`
                                        : ''
                                }
                                ${
                                    this.databaseTypeCassandra
                                        ? `
                                <annotationProcessorPath>
                                    <groupId>com.datastax.oss</groupId>
                                    <artifactId>java-driver-mapper-processor</artifactId>
                                    <version>$\{cassandra-driver.version}</version>
                                </annotationProcessorPath>`
                                        : ''
                                }
                            </annotationProcessorPaths>
                        </configuration>
                    </execution>
                    <execution>
                        <id>compile</id>
                        <phase>process-sources</phase>
                        <goals>
                            <goal>compile</goal>
                        </goals>
                        <configuration>
                            <sourceDirs>
                                <sourceDir>$\{project.basedir}/src/main/fastapi</sourceDir>
                                <sourceDir>$\{project.basedir}/src/main/java</sourceDir>
                            </sourceDirs>
                        </configuration>
                    </execution>
                    <execution>
                        <id>test-compile</id>
                        <phase>process-test-sources</phase>
                        <goals>
                            <goal>test-compile</goal>
                        </goals>
                        <configuration>
                            <sourceDirs>
                                <sourceDir>$\{project.basedir}/src/test/fastapi</sourceDir>
                                <sourceDir>$\{project.basedir}/src/test/java</sourceDir>
                            </sourceDirs>
                        </configuration>
                    </execution>
                </executions>
                <configuration>
                    <jvmTarget>$\{java.version}</jvmTarget>
                    <javaParameters>true</javaParameters>
                    <args>
                        <arg>-Xjvm-default=enable</arg>
                    </args>
                    <compilerPlugins>
                        <plugin>spring</plugin>${
                            this.databaseTypeSql
                                ? `
                        <plugin>jpa</plugin>
                        <plugin>all-open</plugin>`
                                : ''
                        }
                    </compilerPlugins>${
                        this.databaseTypeSql
                            ? `<pluginOptions>
                        <!-- Each annotation is placed on its own line -->
                        <option>all-open:annotation=javax.persistence.Entity</option>
                        <option>all-open:annotation=javax.persistence.MappedSuperclass</option>
                        <option>all-open:annotation=javax.persistence.Embeddable</option>
                    </pluginOptions>`
                            : ''
                    }
                </configuration>
                <dependencies>
                    <dependency>
                        <groupId>org.jetbrains.fastapi</groupId>
                        <artifactId>fastapi-maven-allopen</artifactId>
                        <version>$\{fastapi.version}</version>
                    </dependency>
                    ${
                        this.databaseTypeSql
                            ? `<dependency>
                        <groupId>org.jetbrains.fastapi</groupId>
                        <artifactId>fastapi-maven-noarg</artifactId>
                        <version>$\{fastapi.version}</version>
                    </dependency>`
                            : ''
                    }
                </dependencies>`;
                this.addMavenPlugin('org.jetbrains.fastapi', 'fastapi-maven-plugin', '${fastapi.version}', fastapiOther);

                updatePom(this);
                const defaultCompileOther = `                <executions>
                    <!-- Replacing default-compile as it is treated specially by maven -->
                    <execution>
                        <id>default-compile</id>
                        <phase>none</phase>
                    </execution>
                    <!-- Replacing default-testCompile as it is treated specially by maven -->
                    <execution>
                        <id>default-testCompile</id>
                        <phase>none</phase>
                    </execution>
                    <execution>
                        <id>java-compile</id>
                        <phase>compile</phase>
                        <goals>
                            <goal>compile</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>java-test-compile</id>
                        <phase>test-compile</phase>
                        <goals>
                            <goal>testCompile</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <proc>none</proc>
                </configuration>`;
                this.addMavenPlugin(
                    'org.apache.maven.plugins',
                    'maven-compiler-plugin',
                    '${maven-compiler-plugin.version}',
                    defaultCompileOther
                );
                const ktlintMavenOther = `                <executions>
                    <execution>
                        <id>format</id>
                        <goals>
                            <goal>format</goal>
                        </goals>
                    </execution>
                </executions>`;
                this.addMavenPlugin('com.github.gantsign.maven', 'ktlint-maven-plugin', '${ktlint-maven-plugin.version}', ktlintMavenOther);

                const antRunOther = `                <executions>
                    <execution>
                        <!-- This can be run separately with mvn antrun:run@detekt -->
                        <id>detekt</id>
                        <phase>verify</phase>
                        <configuration>
                            <target name="detekt">
                                <!-- See https://arturbosch.github.io/detekt/cli.html for more options-->
                                <java taskname="detekt" dir="$\{basedir}"
                                      fork="true"
                                      failonerror="true"
                                      classname="io.gitlab.arturbosch.detekt.cli.Main"
                                      classpathref="maven.plugin.classpath">
                                    <arg value="--input"/>
                                    <arg value="$\{project.basedir}/src/main/fastapi"/>
                                    <arg value="--report"/>
                                    <arg value="xml:$\{detekt.xmlReportFile}"/>
                                    <arg value="--config"/>
                                    <arg value="$\{detekt.configFile}"/>
                                </java>
                            </target>
                        </configuration>
                        <goals>
                            <goal>run</goal>
                        </goals>
                    </execution>
                </executions>
                <dependencies>
                    <dependency>
                        <groupId>io.gitlab.arturbosch.detekt</groupId>
                        <artifactId>detekt-cli</artifactId>
                        <version>$\{detekt.version}</version>
                    </dependency>
                    <!-- additional 3rd party ruleset(s) can be specified here -->
                </dependencies>`;
                this.addMavenPlugin('org.apache.maven.plugins', 'maven-antrun-plugin', '${maven-antrun-plugin.version}', antRunOther);
            }
        },
    };
}

/**
 * Manually updates the pom.xml file to perform the following operations:
 * 1. Set the FastAPI source directories as the default (Needed for the ktlint plugin to properly format the sources)
 * 2. Remove the default <maven-compiler-plugin> configuration.
 */
async function updatePom(generator) {
    const _this = generator || this;

    const fullPath = path.join(process.cwd(), 'pom.xml');
    const artifactId = 'maven-compiler-plugin';

    const xml = _this.fs.read(fullPath).toString();
    const $ = cheerio.load(xml, { xmlMode: true });

    // 1. Set the FastAPI source directories as the default
    $('build > defaultGoal').after(`

        <sourceDirectory>src/main/fastapi</sourceDirectory>
        <testSourceDirectory>src/test/fastapi</testSourceDirectory>
`);
    // 2. Remove the default <maven-compiler-plugin> configuration
    $(`build > plugins > plugin > artifactId:contains('${artifactId}')`).parent().remove();

    _this.fs.write(fullPath, $.xml());
}

module.exports = {
    writeFiles,
    serverFiles,
};
