/*
**  GemstoneJS -- Gemstone JavaScript Technology Stack
**  Copyright (c) 2016-2019 Gemstone Project <http://gemstonejs.com>
**  Licensed under Apache License 2.0 <https://spdx.org/licenses/Apache-2.0>
*/

/*  load external requirements  */
const co                       = require("co")
const loaderUtils              = require("loader-utils")
const inlineAssets             = require("inline-assets")
const PostCSS                  = require("postcss")
const PostCSSSCSS              = require("postcss-scss")
const PostCSSImport            = require("postcss-import")
const PostCSSExtendRule        = require("postcss-extend-rule")
const PostCSSAdvancedVariables = require("postcss-advanced-variables")
const PostCSSPresetEnv         = require("postcss-preset-env")
const PostCSSPropertyLookup    = require("postcss-property-lookup")
const PostCSSAlias             = require("postcss-alias")
const PostCSSEasings           = require("postcss-easings")
const PostCSSHexRGBA           = require("postcss-hexrgba")
const PostCSSNested            = require("postcss-nested")
const PostCSSScope             = require("style-scope/postcss")

/*  the exported Webpack loader function  */
module.exports = function (content) {
    const done = this.async()
    co(function * () {
        /*  determine Webpack loader query parameters  */
        const options = Object.assign({}, {
            scope: "none"
        }, loaderUtils.getOptions(this), this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : null)

        /*  indicate to Webpack that our results are
            fully deterministic and can be cached  */
        this.cacheable(true)

        /*  transpile CSS via PostCSS  */
        const plugins = [
            PostCSSImport(),
            PostCSSExtendRule(),
            PostCSSAdvancedVariables(),
            PostCSSPresetEnv({
                stage: 3,                           /*  stage 2-3, plus... */
                features: {
                    "nesting-rules":         true,  /*  from stage 0  */
                    "overflow-shorthand":    true   /*  from stage 1  */
                },
                browsers: "last 2 versions",
                autoprefixer: {
                    browsers: [ "last 2 versions" ]
                }
            }),
            PostCSSPropertyLookup(),
            PostCSSAlias(),
            PostCSSEasings(),
            PostCSSHexRGBA(),
            PostCSSNested(),
            PostCSSScope({
                rootScope: options.scope
            })
        ]
        let result = yield PostCSS(plugins).process(content, {
            from:   this.resourcePath,
            to:     this.resourcePath,
            parser: PostCSSSCSS,
            map:    { inline: true }
        }).catch((err) => {
            this.emitError(`gemstone-loader-css: PostCSS [transpile]: ERROR: ${err}`)
        })
        if (typeof result === "object" && typeof result.warnings === "function") {
            const warnings = result.warnings()
            if (warnings.length > 0)
                this.emitError(`gemstone-loader-css: PostCSS [transpile]: ERROR: ${warnings.join("\n")}`)
        }
        if (typeof result === "object" && typeof result.css === "string")
            result = result.css
        else
            result = "/* INTERNAL ERROR */"

        /*  inline all referenced assets to be self-contained  */
        result = inlineAssets(this.resourcePath, this.resourcePath, result, {
            htmlmin: false,
            cssmin:  this.minimize,
            jsmin:   false,
            pattern: [ ".+" ],
            purge:   false
        })

        /*  generate output  */
        result = "module.exports = " + JSON.stringify(result)

        done(null, result)
    }.bind(this)).catch((err) => {
        this.emitError("gemstone-loader-css: ERROR: " + err)
        done(err)
    })
}

