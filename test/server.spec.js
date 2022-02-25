const expect = require('expect');
const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const angularfiles = require('generator-jhipster/generators/client/files-angular').files;
const { JWT, OAUTH2 } = require('generator-jhipster/jdl/jhipster/authentication-types');
const { CAFFEINE, EHCACHE } = require('generator-jhipster/jdl/jhipster/cache-types');
const { SQL, H2_MEMORY, POSTGRESQL } = require('generator-jhipster/jdl/jhipster/database-types');
const { MAVEN } = require('generator-jhipster/jdl/jhipster/build-tool-types');
const getFilesForOptions = require('./utils/utils').getFilesForOptions;
const expectedFiles = require('./utils/expected-files');

describe('JHipster server generator', () => {
    describe('generate server with ehcache', () => {
        before(async () => {
            await helpers
                .create(path.join(__dirname, '../generators/app'))
                .withOptions({
                    withGeneratedFlag: true,
                    blueprints: 'fastapi',
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    'skip-black-format': true,
                    skipClient: true,
                })
                .withPrompts({
                    baseName: 'jhipster',
                    packageName: 'com.mycompany.myapp',
                    packageFolder: 'com/mycompany/myapp',
                    serviceDiscoveryType: false,
                    authenticationType: JWT,
                    cacheProvider: EHCACHE,
                    enableHibernateCache: true,
                    databaseType: SQL,
                    devDatabaseType: H2_MEMORY,
                    prodDatabaseType: POSTGRESQL,
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr'],
                    buildTool: MAVEN,
                    rememberMeKey: '5c37379956bd1242f5636c8cb322c2966ad81277',
                    serverSideOptions: [],
                })
                .run();
        });

        it('creates expected files for default configuration for server generator', () => {
            assert.file(expectedFiles.common);
            assert.file(expectedFiles.server);
            assert.file(expectedFiles.jwtServer);
            assert.file(expectedFiles.userManagementServer);
            assert.file(expectedFiles.maven);
            assert.file(expectedFiles.postgresql);
            assert.file(expectedFiles.hibernateTimeZoneConfig);
            assert.noFile(
                getFilesForOptions(
                    angularfiles,
                    {
                        enableTranslation: true,
                        serviceDiscoveryType: false,
                        authenticationType: JWT,
                        testFrameworks: [],
                    },
                    null,
                    ['package.json']
                )
            );
        });
    });

    describe('generate server with caffeine', () => {
        before(async () => {
            await helpers
                .create(path.join(__dirname, '../generators/app'))
                .withOptions({
                    withGeneratedFlag: true,
                    blueprints: 'fastapi',
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    'skip-black-format': true,
                    skipClient: true,
                })
                .withPrompts({
                    baseName: 'jhipster',
                    packageName: 'com.mycompany.myapp',
                    packageFolder: 'com/mycompany/myapp',
                    serviceDiscoveryType: false,
                    authenticationType: JWT,
                    cacheProvider: CAFFEINE,
                    enableHibernateCache: true,
                    databaseType: SQL,
                    devDatabaseType: H2_MEMORY,
                    prodDatabaseType: POSTGRESQL,
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr'],
                    buildTool: MAVEN,
                    rememberMeKey: '5c37379956bd1242f5636c8cb322c2966ad81277',
                    serverSideOptions: [],
                })
                .run();
        });

        it('creates expected files for caffeine cache configuration for server generator', () => {
            assert.file(expectedFiles.common);
            assert.file(expectedFiles.server);
            assert.file(expectedFiles.jwtServer);
            assert.file(expectedFiles.userManagementServer);
            assert.file(expectedFiles.maven);
            assert.file(expectedFiles.postgresql);
            assert.file(expectedFiles.hibernateTimeZoneConfig);
            assert.noFile(
                getFilesForOptions(
                    angularfiles,
                    {
                        enableTranslation: true,
                        serviceDiscoveryType: false,
                        authenticationType: JWT,
                        testFrameworks: [],
                    },
                    null,
                    ['package.json']
                )
            );
        });
    });
    describe('microfrontend', () => {
        let runResult;
        before(async () => {
            runResult = await helpers
                .create(path.join(__dirname, '../generators/app'))
                .withOptions({
                    withGeneratedFlag: true,
                    blueprints: 'fastapi',
                    'from-cli': true,
                    skipInstall: true,
                    skipChecks: true,
                    'skip-black-format': true,
                    skipClient: true,
                })
                .withPrompts({
                    baseName: 'jhipster',
                    skipInstall: true,
                    auth: OAUTH2,
                    microfrontend: true,
                    enableTranslation: true,
                    nativeLanguage: 'en',
                    languages: ['fr', 'en'],
                    withGeneratedFlag: true,
                })
                .run();
        });
        it('should match generated files snapshot', () => {
            expect(runResult.getStateSnapshot()).toMatchSnapshot();
        });
    });
});
