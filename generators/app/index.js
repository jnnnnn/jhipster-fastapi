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
/* eslint-disable consistent-return */
const BaseGenerator = require('generator-jhipster/generators/app');
const { displayLogo } = require('./util');

module.exports = class extends BaseGenerator {
    constructor(args, opts) {
        super(args, { fromBlueprint: true, ...opts });

        // This adds support for a `--skip-black-format` flag
        this.option('skip-black-format', {
            desc: 'Indicates to skip formatting using black',
            type: Boolean,
        });
    }

    get initializing() {
        // Override logo when we run phipster command
        const initializer = {
            ...super._initializing(),
            displayLogo,
        };

        return initializer;
    }

    get prompting() {
        return super._prompting();
    }

    get configuring() {
        return super._configuring();
    }

    get composing() {
        return super._composing();
    }

    get default() {
        return super._default();
    }

    get writing() {
        return super._writing();
    }

    get install() {
        return super._install();
    }

    get end() {
        return super._end();
    }
};
