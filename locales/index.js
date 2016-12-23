var i18next = require('i18next'),
    Backend = require('i18next-sync-fs-backend');

var defaultOpts = {
    "debug": false,
    "initImmediate": false,
    "lng": "zh",
    "ns": [
        "common",
        "sso",
        "home",
        "bank",
        "card",
        "acl",
        "activity",
        "appManager",
        "shop",
        "baoxiang",
        "pay",
        "agent",
        "auth",
        "dak",
        "depot"
    ],
    "defaultNS": [
        "common",
        "sso",
        "home",
        "bank",
        "card",
        "acl",
        "activity",
        "appManager",
        "shop",
        "baoxiang",
        "pay",
        "agent",
        "auth",
        "dak",
        "depot"
    ],
    "fallbackLng": ["en",'zh','vi'],
    "fallbackNS": ["common"],
    "whitelist": false,
    "load": "all",
    "preload": false,
    "keySeparator": ".",
    "nsSeparator": ":",
    "pluralSeparator": "_",
    "contextSeparator": "_",
    "saveMissing": false,
    "saveMissingTo": "fallback",
    "missingKeyHandler": false,
    "postProcess": false,
    "returnNull": true,
    "returnEmptyString": true,
    "returnObjects": false,
    "joinArrays": ',',
    "parseMissingKeyHandler": false,
    "appendNamespaceToMissingKey": false,
    "interpolation": {
        "escapeValue": true,
        "prefix": "{{",
        "suffix": "}}",
        "unescapePrefix": "-",
        "nestingPrefix": "$t(",
        "nestingSuffix": ")"
    },
    "backend": {
        "loadPath": "locales/{{lng}}/{{ns}}.json",
        "addPath": "locales/add/{{lng}}/{{ns}}",
        "allowMultiLoading": true,
        "crossDomain": false
    }
};

i18next
    .use(Backend)
    .init(defaultOpts, function(err,t){
    });

module.exports = i18next;
