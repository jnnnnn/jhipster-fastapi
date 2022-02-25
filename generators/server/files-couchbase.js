/**
 * Copyright 2013-2021 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const constants = require('generator-jhipster/generators/generator-constants');
const { MONOLITH } = require('generator-jhipster/jdl/jhipster/application-types');
const { OAUTH2, SESSION } = require('generator-jhipster/jdl/jhipster/authentication-types');
const { COUCHBASE } = require('generator-jhipster/jdl/jhipster/database-types');

/* Constants use throughout */
const DOCKER_DIR = constants.DOCKER_DIR;
// const SERVER_MAIN_SRC_DIR = constants.SERVER_MAIN_SRC_DIR;
const SERVER_MAIN_RES_DIR = constants.SERVER_MAIN_RES_DIR;
// const SERVER_TEST_SRC_DIR = constants.SERVER_TEST_SRC_DIR;
const SERVER_MAIN_FASTAPI_SRC_DIR = `${constants.MAIN_DIR}fastapi/`;
const SERVER_TEST_SRC_FASTAPI_DIR = `${constants.TEST_DIR}fastapi/`;

const shouldSkipUserManagement = generator =>
    generator.skipUserManagement && (generator.applicationType !== MONOLITH || generator.authenticationType !== OAUTH2);

const couchbaseFiles = {
    docker: [
        {
            path: DOCKER_DIR,
            templates: ['couchbase.yml', 'couchbase-cluster.yml', 'couchbase/Couchbase.Dockerfile', 'couchbase/scripts/configure-node.sh'],
        },
    ],
    serverJavaConfig: [
        {
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/config/couchbase/CustomCouchbaseRepositoryFactory.kt',
                    renameTo: generator => `${generator.javaDir}config/couchbase/CustomCouchbaseRepositoryFactory.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/couchbase/CustomCouchbaseRepositoryFactoryBean.kt',
                    renameTo: generator => `${generator.javaDir}config/couchbase/CustomCouchbaseRepositoryFactoryBean.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/couchbase/CustomCouchbaseRepositoryQuery.kt',
                    renameTo: generator => `${generator.javaDir}config/couchbase/CustomCouchbaseRepositoryQuery.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/couchbase/CustomN1qlQueryCreator.kt',
                    renameTo: generator => `${generator.javaDir}config/couchbase/CustomN1qlQueryCreator.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/config/couchbase/CustomN1qlRepositoryQueryExecutor.kt',
                    renameTo: generator => `${generator.javaDir}config/couchbase/CustomN1qlRepositoryQueryExecutor.kt`,
                    useBluePrint: true,
                },
                {
                    file: 'package/repository/JHipsterCouchbaseRepository.kt',
                    renameTo: generator => `${generator.javaDir}repository/JHipsterCouchbaseRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => !shouldSkipUserManagement(generator) && generator.authenticationType === SESSION && !generator.reactive,
            path: SERVER_MAIN_FASTAPI_SRC_DIR,
            templates: [
                {
                    file: 'package/repository/PersistentTokenRepository_couchbase.kt',
                    renameTo: generator => `${generator.javaDir}repository/PersistentTokenRepository.kt`,
                    useBluePrint: true,
                },
            ],
        },
        {
            condition: generator => generator.searchEngine === COUCHBASE,
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/repository/JHipsterCouchbaseRepositoryTest.kt',
                    renameTo: generator => `${generator.testDir}repository/JHipsterCouchbaseRepositoryTest.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
    serverResource: [
        {
            path: SERVER_MAIN_RES_DIR,
            templates: ['config/couchmove/changelog/V0__create_indexes.n1ql'],
        },
        {
            condition: generator => !generator.skipUserManagement || generator.authenticationType === OAUTH2,
            path: SERVER_MAIN_RES_DIR,
            templates: [
                'config/couchmove/changelog/V0.1__initial_setup/ROLE_ADMIN.json',
                'config/couchmove/changelog/V0.1__initial_setup/ROLE_USER.json',
                'config/couchmove/changelog/V0.1__initial_setup/user__admin.json',
                'config/couchmove/changelog/V0.1__initial_setup/user__user.json',
            ],
        },
    ],
    serverTestFw: [
        {
            path: SERVER_TEST_SRC_FASTAPI_DIR,
            templates: [
                {
                    file: 'package/CouchbaseTestContainerExtension.kt',
                    renameTo: generator => `${generator.testDir}CouchbaseTestContainerExtension.kt`,
                    useBluePrint: true,
                },
            ],
        },
    ],
};

function writeCouchbaseFiles() {
    return {
        cleanupCouchbaseFiles() {
            if (!this.databaseTypeCouchbase) return;

            if (this.isJhipsterVersionLessThan('7.1.1')) {
                this.removeFile(`${this.javaDir}repository/CustomReactiveCouchbaseRepository.kt`);
                this.removeFile(`${this.testDir}config/DatabaseConfigurationIT.kt`);
                this.removeFile(`${this.javaDir}repository/N1qlCouchbaseRepository.kt`);
                this.removeFile(`${this.javaDir}repository/ReactiveN1qlCouchbaseRepository.kt`);
                this.removeFile(`${this.javaDir}repository/CustomN1qlCouchbaseRepository.kt`);
                this.removeFile(`${this.javaDir}repository/CustomCouchbaseRepository.kt`);
                this.removeFile(`${this.javaDir}repository/SearchCouchbaseRepository.kt`);
                this.removeFile(`${this.testDir}repository/CustomCouchbaseRepositoryTest.kt`);
            }
        },

        async writeCouchbaseFiles() {
            if (!this.databaseTypeCouchbase) return;

            await this.writeFiles({
                sections: couchbaseFiles,
                rootTemplatesPath: 'couchbase',
            });
        },
    };
}

module.exports = {
    couchbaseFiles,
    writeCouchbaseFiles,
};
