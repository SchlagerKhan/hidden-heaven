import { join } from 'node:path';

import { findUp, fse, readJson } from '../utils';
import { cwd, sourceFolderName__flag } from './index.context.args';

type Dictionary = Record<string, any>;
type Dictionary__Optional = Record<string, any> | undefined;

const configFileNames = ['hiddenHeaven', 'hidden-heaven', 'hide', 'hh'];
const configFileNames__json = configFileNames.map((name) => `${name}.json`);
const configFileNames__js = configFileNames.map((name) => `${name}.js`);

async function findContext__package() {
    return findUp('package.json', cwd)
        .then((filePath) => {
            return readJson<Dictionary>(filePath);
        })
        .then((pkg) => {
            return pkg['hiddenHeaven'] || pkg['hidden-heaven'] || pkg['hide'];
        })
        .then((context) => {
            return context as Dictionary__Optional;
        });
}

async function findContext__files__json(childrenNames: string[]) {
    const configFileName__json = childrenNames.find((childName) => {
        return configFileNames__json.includes(childName);
    });

    if (configFileName__json) {
        const configFilePath = join(sourceFolderName__flag, configFileName__json);

        return readJson<Dictionary>(configFilePath);
    }

    return undefined;
}

function findContext__files__js(childrenNames: string[]) {
    const configFileName__js = childrenNames.find((childName) => {
        return configFileNames__js.includes(childName);
    });

    if (configFileName__js) {
        const configFilePath = join(process.cwd(), sourceFolderName__flag, configFileName__js);

        return require(configFilePath)();
    }

    return undefined;
}

async function findContext__files() {
    const sourceFolderExists = await fse.exists(sourceFolderName__flag);

    if (!sourceFolderExists) {
        return {};
    }

    const childrenNames = await fse.readdir(sourceFolderName__flag);

    return findContext__files__json(childrenNames).then((ctx) => {
        return ctx || findContext__files__js(childrenNames);
    });
}

export async function findContext() {
    const context = await findContext__package().then((ctx) => {
        return ctx || findContext__files();
    });

    const sourceFolderName = context?.sourceFolderName || sourceFolderName__flag;

    return { ...context, sourceFolderName, cwd };
}
