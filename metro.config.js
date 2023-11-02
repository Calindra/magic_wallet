// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {

    // fix Unable to resolve "@metaplex-foundation/umi/serializers"
    if (moduleName === '@metaplex-foundation/umi/serializers') {
        moduleName = '@metaplex-foundation/umi-serializers'
    }
    return context.resolveRequest(context, moduleName, platform);
}

module.exports = config;
